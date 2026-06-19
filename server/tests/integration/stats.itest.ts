import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { getAdminStats } from '../../src/services/statsService';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for the admin analytics (OBS-3). The stats are
 * derived from the gameplay tables + events trail, so we play a real solo game
 * to populate them, then assert the aggregate snapshot. The route's auth guard
 * is checked separately (no admin hash needed for a 401).
 */
describe('admin analytics (integration)', () => {
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

  it('GET /api/admin/stats requires admin auth', async () => {
    const res = await request(app).get('/api/admin/stats');
    expect(res.status).toBe(401);
  });

  it('derives games, answers, distributions, and user metrics from real play', async () => {
    // Empty DB → zeroed, well-formed snapshot.
    const empty = await getAdminStats();
    expect(empty.games.total).toBe(0);
    expect(empty.answers).toBe(0);
    expect(empty.users.unique).toBe(0);
    expect(empty.accuracyPct).toBe(0);

    // Play a full solo game so there is data to aggregate.
    const agent = request.agent(app);
    await agent.post('/api/session').send({ nickname: 'Ada' });
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    for (const q of questions) {
      await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0], elapsedMs: 1500 });
    }
    await agent.post(`/api/games/${gameId}/complete`);

    const stats = await getAdminStats();
    expect(stats.games.total).toBe(1);
    expect(stats.games.solo).toBe(1);
    expect(stats.games.completed).toBe(1);
    expect(stats.answers).toBe(5);
    expect(stats.questions).toBeGreaterThanOrEqual(12);
    expect(stats.accuracyPct).toBeGreaterThanOrEqual(0);
    expect(stats.byCategory.length).toBeGreaterThanOrEqual(1);
    expect(stats.byDifficulty.length).toBeGreaterThanOrEqual(1);
    expect(stats.mostMissed.length).toBeGreaterThanOrEqual(1);
    // answer_submitted events are recorded in the audit trail (DB-5).
    expect(stats.recent.some((e) => e.type === 'answer_submitted')).toBe(true);

    // User analytics.
    expect(stats.users.unique).toBe(1);
    expect(stats.users.avgGamesPerPlayer).toBeGreaterThanOrEqual(1);
    expect(stats.users.top[0]?.nickname).toBe('Ada');
  });
});
