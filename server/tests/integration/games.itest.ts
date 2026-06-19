import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for every solo games endpoint (API-4). Requires a
 * real Postgres (DATABASE_URL) with migrations applied — runs in CI. Uses a
 * supertest agent so the session cookie (and thus the player) persists.
 */
describe('solo games API (integration)', () => {
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

  /** Authenticated agent with a nickname session set. */
  async function makePlayerAgent(nickname = 'Ada') {
    const agent = request.agent(app);
    const res = await agent.post('/api/session').send({ nickname });
    expect(res.status).toBe(200);
    return agent;
  }

  it('POST /api/games requires a session', async () => {
    const res = await request(app).post('/api/games').send({ mode: 'solo', count: 5 });
    expect(res.status).toBe(401);
  });

  it('POST /api/games rejects an invalid body', async () => {
    const agent = await makePlayerAgent();
    // Unknown mode + out-of-range count are both rejected by the schema.
    const res = await agent.post('/api/games').send({ mode: 'banana', count: 0 });
    expect(res.status).toBe(400);
  });

  it('POST /api/games creates a solo game and returns un-flagged choices', async () => {
    const agent = await makePlayerAgent();
    const res = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    expect(res.status).toBe(201);
    expect(res.body.gameId).toBeTruthy();
    expect(res.body.questions).toHaveLength(5);
    const q = res.body.questions[0];
    expect(q.choices.length).toBeGreaterThanOrEqual(2);
    // No correct-answer leak: payload is plain strings, no flags.
    expect(q).not.toHaveProperty('correctAnswer');
    expect(q).not.toHaveProperty('correct_answer');
    expect(q.choices.every((c: unknown) => typeof c === 'string')).toBe(true);
  });

  it('POST /api/games honours a category + difficulty filter', async () => {
    const agent = await makePlayerAgent();
    const res = await agent
      .post('/api/games')
      .send({ mode: 'solo', categorySlug: 'science', difficulty: 'easy', count: 5 });
    expect(res.status).toBe(201);
    expect(res.body.questions.length).toBeGreaterThanOrEqual(1);
    expect(res.body.questions[0].difficulty).toBe('easy');
  });

  it('GET /api/games/:id/questions returns the locked set', async () => {
    const agent = await makePlayerAgent();
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    const res = await agent.get(`/api/games/${gameId}/questions`);
    expect(res.status).toBe(200);
    expect(res.body.questions.map((q: { id: string }) => q.id)).toEqual(
      questions.map((q: { id: string }) => q.id),
    );
  });

  it('POST /api/games/:id/answers grades server-side', async () => {
    const agent = await makePlayerAgent();
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    const first = questions[0];

    const wrong = await agent
      .post(`/api/games/${gameId}/answers`)
      .send({ questionId: first.id, selectedAnswer: '__definitely_wrong__' });
    expect(wrong.status).toBe(200);
    expect(wrong.body.correct).toBe(false);
    expect(typeof wrong.body.correctAnswer).toBe('string');

    const right = await agent
      .post(`/api/games/${gameId}/answers`)
      .send({ questionId: first.id, selectedAnswer: wrong.body.correctAnswer });
    expect(right.body.correct).toBe(true);
  });

  it('plays a full game: complete + result review', async () => {
    const agent = await makePlayerAgent();
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;

    // Answer every question with its first choice (mix of right/wrong).
    let expectedScore = 0;
    for (const q of questions) {
      const ans = await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0], elapsedMs: 1200 });
      if (ans.body.correct) expectedScore += 1;
    }

    const complete = await agent.post(`/api/games/${gameId}/complete`);
    expect(complete.status).toBe(200);
    expect(complete.body.total).toBe(5);
    expect(complete.body.score).toBe(expectedScore);

    const result = await agent.get(`/api/games/${gameId}/result`);
    expect(result.status).toBe(200);
    expect(result.body.score).toBe(expectedScore);
    expect(result.body.total).toBe(5);
    expect(result.body.review).toHaveLength(5);
    expect(result.body.review[0]).toHaveProperty('question');
    expect(result.body.review[0]).toHaveProperty('correct');
    expect(result.body.review[0]).toHaveProperty('isCorrect');
  });

  it('GET /api/games/:id/result 404s for an unknown game', async () => {
    const agent = await makePlayerAgent();
    const res = await agent.get('/api/games/00000000-0000-0000-0000-000000000000/result');
    expect(res.status).toBe(404);
  });
});
