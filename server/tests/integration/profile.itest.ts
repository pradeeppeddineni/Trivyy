import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration test for the per-player profile (spec v3 §13): after a
 * game, GET /api/me/stats reflects the player's own games/points/accuracy.
 */
describe('profile stats API (integration)', () => {
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

  it('requires a session', async () => {
    expect((await request(app).get('/api/me/stats')).status).toBe(401);
  });

  it('reflects a finished solo game', async () => {
    const agent = request.agent(app);
    await agent.post('/api/session').send({ nickname: 'Ada' });
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    for (const q of questions) {
      await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0] });
    }
    await agent.post(`/api/games/${gameId}/complete`);

    const stats = await agent.get('/api/me/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.games).toBe(1);
    expect(stats.body.answers).toBe(5);
    expect(stats.body.accuracyPct).toBeGreaterThanOrEqual(0);
    expect(stats.body.accuracyPct).toBeLessThanOrEqual(100);
    expect(stats.body.byCategory.length).toBeGreaterThanOrEqual(1);
    expect(stats.body.recent).toHaveLength(1);
    expect(stats.body.recent[0].total).toBe(5);
  });
});
