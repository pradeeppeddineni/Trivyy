import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { createQuestion } from '../../src/services/questionAdminService';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration test for the region filter (spec §5.6): a game created
 * with a region only draws questions tagged with that region.
 */
describe('regional questions (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp(loadEnv());
  });

  beforeEach(async () => {
    await resetGameData();
    await seedQuestions(); // all region NULL (global)
  });

  afterAll(async () => {
    await testPool.end();
    await pool.end();
  });

  it('a region-filtered game serves only that region', async () => {
    // Author two India-tagged questions (the seed set is all global).
    await createQuestion({
      text: 'IN-Q1: which river is the longest in India?',
      correctAnswer: 'Ganga',
      incorrectAnswers: ['Yamuna', 'Godavari'],
      difficulty: 'easy',
      region: 'IN',
    });
    await createQuestion({
      text: 'IN-Q2: which city is the capital of India?',
      correctAnswer: 'New Delhi',
      incorrectAnswers: ['Mumbai', 'Kolkata'],
      difficulty: 'easy',
      region: 'IN',
    });

    const agent = request.agent(app);
    await agent.post('/api/session').send({ nickname: 'Ada' });
    const res = await agent.post('/api/games').send({ mode: 'solo', count: 2, region: 'IN' });
    expect(res.status).toBe(201);
    expect(res.body.questions).toHaveLength(2);
    for (const q of res.body.questions) {
      expect(q.text.startsWith('IN-')).toBe(true);
    }
  });

  it('rejects a malformed region', async () => {
    const agent = request.agent(app);
    await agent.post('/api/session').send({ nickname: 'Ada' });
    const res = await agent.post('/api/games').send({ mode: 'solo', count: 5, region: 'India' });
    expect(res.status).toBe(400);
  });
});
