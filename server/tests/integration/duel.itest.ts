import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for the async duel mode (spec §4.2): create →
 * share code → opponent joins same locked set → head-to-head result. Each
 * player uses its own supertest agent so the session/player is distinct.
 */
describe('duel games API (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp(loadEnv());
  });

  beforeEach(async () => {
    await resetGameData();
    await seedQuestions();
  });

  afterAll(async () => {
    await testPool.end();
    await pool.end();
  });

  async function makePlayerAgent(nickname: string) {
    const agent = request.agent(app);
    const res = await agent.post('/api/session').send({ nickname });
    expect(res.status).toBe(200);
    return agent;
  }

  /** Map question id -> correct answer, read straight from the DB for the test. */
  async function correctAnswers(): Promise<Map<string, string>> {
    const rows = await testPool.query<{ id: string; correct_answer: string }>(
      `SELECT id, correct_answer FROM questions`,
    );
    return new Map(rows.rows.map((r) => [r.id, r.correct_answer]));
  }

  /** Answer every question: correct ones get the right answer, the rest a miss. */
  async function playRound(
    agent: ReturnType<typeof request.agent>,
    gameId: string,
    questions: Array<{ id: string }>,
    key: Map<string, string>,
    correctCount: number,
  ) {
    for (let i = 0; i < questions.length; i += 1) {
      const answer = i < correctCount ? key.get(questions[i].id)! : '__wrong__';
      await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: questions[i].id, selectedAnswer: answer });
    }
    const done = await agent.post(`/api/games/${gameId}/complete`);
    expect(done.status).toBe(200);
  }

  it('creator wins: full flow create → join → head-to-head', async () => {
    const key = await correctAnswers();
    const creator = await makePlayerAgent('Ada');
    const opponent = await makePlayerAgent('Bob');

    const created = await creator.post('/api/games').send({ mode: 'duel', count: 5 });
    expect(created.status).toBe(201);
    expect(created.body.mode).toBe('duel');
    expect(created.body.code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
    const { gameId, code, questions } = created.body;
    expect(questions).toHaveLength(5);

    // Creator finishes first (all correct) → result is "waiting" for the opponent.
    await playRound(creator, gameId, questions, key, 5);
    const waiting = await creator.get(`/api/games/${gameId}/result`);
    expect(waiting.status).toBe(200);
    expect(waiting.body.status).toBe('waiting');
    expect(waiting.body.opponent).toBeNull();
    expect(waiting.body.you.score).toBe(5);

    // Opponent joins by code, gets the SAME locked set, scores lower.
    const joined = await opponent.post('/api/games/join').send({ code });
    expect(joined.status).toBe(200);
    expect(joined.body.role).toBe('opponent');
    expect(joined.body.questions.map((q: { id: string }) => q.id)).toEqual(
      questions.map((q: { id: string }) => q.id),
    );
    await playRound(opponent, gameId, joined.body.questions, key, 2);

    // Both finished → complete, with the decided outcome from each perspective.
    const creatorView = await creator.get(`/api/games/${gameId}/result`);
    expect(creatorView.body.status).toBe('complete');
    expect(creatorView.body.you.score).toBe(5);
    expect(creatorView.body.opponent.score).toBe(2);
    expect(creatorView.body.outcome).toBe('win');

    const opponentView = await opponent.get(`/api/games/${gameId}/result`);
    expect(opponentView.body.outcome).toBe('loss');
    expect(opponentView.body.you.score).toBe(2);
    expect(opponentView.body.opponent.score).toBe(5);
  });

  it('equal scores are a draw', async () => {
    const key = await correctAnswers();
    const creator = await makePlayerAgent('Ada');
    const opponent = await makePlayerAgent('Bob');

    const created = await creator.post('/api/games').send({ mode: 'duel', count: 5 });
    const { gameId, code, questions } = created.body;
    await playRound(creator, gameId, questions, key, 3);

    const joined = await opponent.post('/api/games/join').send({ code });
    await playRound(opponent, gameId, joined.body.questions, key, 3);

    const view = await creator.get(`/api/games/${gameId}/result`);
    expect(view.body.status).toBe('complete');
    expect(view.body.outcome).toBe('draw');
  });

  it('join rejects a bad code and a third player', async () => {
    const creator = await makePlayerAgent('Ada');
    const created = await creator.post('/api/games').send({ mode: 'duel', count: 5 });
    const { code } = created.body;

    const bob = await makePlayerAgent('Bob');
    const cara = await makePlayerAgent('Cara');

    const bad = await bob.post('/api/games/join').send({ code: 'ZZZZZ' });
    expect(bad.status).toBe(404);

    const ok = await bob.post('/api/games/join').send({ code });
    expect(ok.status).toBe(200);

    const full = await cara.post('/api/games/join').send({ code });
    expect(full.status).toBe(409);
  });

  it('join requires a session', async () => {
    const creator = await makePlayerAgent('Ada');
    const created = await creator.post('/api/games').send({ mode: 'duel', count: 5 });
    const res = await request(app).post('/api/games/join').send({ code: created.body.code });
    expect(res.status).toBe(401);
  });
});
