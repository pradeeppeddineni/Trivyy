import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for the group "play together" mode (spec §4.4):
 * host → lobby → players join → start → each plays the same set → leaderboard.
 */
describe('group games API (integration)', () => {
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

  async function correctAnswers(): Promise<Map<string, string>> {
    const rows = await testPool.query<{ id: string; correct_answer: string }>(
      `SELECT id, correct_answer FROM questions`,
    );
    return new Map(rows.rows.map((r) => [r.id, r.correct_answer]));
  }

  async function playRound(
    agent: ReturnType<typeof request.agent>,
    gameId: string,
    key: Map<string, string>,
    correctCount: number,
  ) {
    const got = await agent.get(`/api/games/${gameId}/questions`);
    expect(got.status).toBe(200);
    const questions: Array<{ id: string }> = got.body.questions;
    for (let i = 0; i < questions.length; i += 1) {
      const answer = i < correctCount ? key.get(questions[i].id)! : '__wrong__';
      await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: questions[i].id, selectedAnswer: answer });
    }
    const done = await agent.post(`/api/games/${gameId}/complete`);
    expect(done.status).toBe(200);
  }

  it('host → lobby → start → leaderboard (with a tie)', async () => {
    const key = await correctAnswers();
    const host = await makePlayerAgent('Ada');
    const p2 = await makePlayerAgent('Bob');
    const p3 = await makePlayerAgent('Cara');

    const created = await host.post('/api/games').send({ mode: 'together', count: 5 });
    expect(created.status).toBe(201);
    expect(created.body.mode).toBe('together');
    expect(created.body.code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
    const { gameId, code } = created.body;

    // Lobby starts with just the host.
    let lobby = await host.get(`/api/games/${gameId}/lobby`);
    expect(lobby.body.status).toBe('open');
    expect(lobby.body.players).toHaveLength(1);
    expect(lobby.body.players[0].isHost).toBe(true);

    expect((await p2.post('/api/games/join').send({ code })).status).toBe(200);
    expect((await p3.post('/api/games/join').send({ code })).status).toBe(200);

    lobby = await host.get(`/api/games/${gameId}/lobby`);
    expect(lobby.body.players).toHaveLength(3);
    expect(lobby.body.players[0].isHost).toBe(true); // host listed first

    // Only the host can start.
    expect((await p2.post(`/api/games/${gameId}/start`)).status).toBe(403);
    const started = await host.post(`/api/games/${gameId}/start`);
    expect(started.status).toBe(200);
    expect(started.body.status).toBe('in_progress');

    // Lobby is now closed to new joiners.
    const late = await makePlayerAgent('Dan');
    expect((await late.post('/api/games/join').send({ code })).status).toBe(409);

    // Scores: host 5, Cara 5 (tie at the top), Bob 3.
    await playRound(host, gameId, key, 5);
    await playRound(p2, gameId, key, 3);
    await playRound(p3, gameId, key, 5);

    const board = await host.get(`/api/games/${gameId}/leaderboard`);
    expect(board.status).toBe(200);
    expect(board.body.status).toBe('complete');
    expect(board.body.total).toBe(5);
    const entries = board.body.entries as Array<{
      rank: number;
      nickname: string;
      score: number;
    }>;
    expect(entries).toHaveLength(3);
    // Top two tie at rank 1 (score 5); Bob is rank 3 (score 3).
    expect(entries[0].score).toBe(5);
    expect(entries[1].score).toBe(5);
    expect(entries[0].rank).toBe(1);
    expect(entries[1].rank).toBe(1);
    expect(entries[2].nickname).toBe('Bob');
    expect(entries[2].rank).toBe(3);
  });

  it('join rejects a bad code', async () => {
    const p = await makePlayerAgent('Bob');
    const res = await p.post('/api/games/join').send({ code: 'ZZZZZ' });
    expect(res.status).toBe(404);
  });

  it('enforces the host-chosen player cap', async () => {
    const host = await makePlayerAgent('Ada');
    // maxPlayers = 2 → host + one joiner fills it; the next join is rejected.
    const created = await host
      .post('/api/games')
      .send({ mode: 'together', count: 5, maxPlayers: 2 });
    const { code } = created.body;

    const p2 = await makePlayerAgent('Bob');
    const p3 = await makePlayerAgent('Cara');
    expect((await p2.post('/api/games/join').send({ code })).status).toBe(200);
    const full = await p3.post('/api/games/join').send({ code });
    expect(full.status).toBe(409);
  });
});
