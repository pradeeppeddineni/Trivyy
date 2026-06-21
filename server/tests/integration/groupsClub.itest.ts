import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for persistent groups (spec v3 §13.3): create,
 * join, detail, and standings that aggregate a group-tagged game.
 */
describe('persistent groups API (integration)', () => {
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

  async function makeAccount(username: string) {
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({ username, password: 'password1' });
    expect(reg.status).toBe(201);
    return agent;
  }

  it('requires an account', async () => {
    expect((await request(app).get('/api/groups')).status).toBe(401);
    expect((await request(app).post('/api/groups').send({ name: 'X' })).status).toBe(401);
  });

  it('create → join → detail shows both members', async () => {
    const ada = await makeAccount('ada');
    const bob = await makeAccount('bob');

    const created = await ada.post('/api/groups').send({ name: 'Quiz Club' });
    expect(created.status).toBe(201);
    expect(created.body.code).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
    const { id, code } = created.body;

    expect((await ada.get('/api/groups')).body.groups[0].name).toBe('Quiz Club');

    const joined = await bob.post('/api/groups/join').send({ code });
    expect(joined.status).toBe(200);

    const detail = await ada.get(`/api/groups/${id}`);
    expect(detail.body.members).toHaveLength(2);
    expect(detail.body.isOwner).toBe(true);
    const owner = detail.body.members.find((m: { isOwner: boolean }) => m.isOwner);
    expect(owner.nickname).toBe('ada');

    // A non-member cannot see the group.
    const cara = await makeAccount('cara');
    expect((await cara.get(`/api/groups/${id}`)).status).toBe(403);
  });

  it('standings aggregate a group-tagged game', async () => {
    const ada = await makeAccount('ada');
    const created = await ada.post('/api/groups').send({ name: 'Quiz Club' });
    const groupId = created.body.id;

    // Owner runs a together game tagged with the group, then plays it.
    const game = await ada.post('/api/games').send({ mode: 'together', count: 5, groupId });
    expect(game.status).toBe(201);
    const gameId = game.body.gameId;

    await ada.post(`/api/games/${gameId}/start`);
    const qs = (await ada.get(`/api/games/${gameId}/questions`)).body.questions;
    for (const q of qs) {
      await ada
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0] });
    }
    await ada.post(`/api/games/${gameId}/complete`);

    const standings = await ada.get(`/api/groups/${groupId}/standings`);
    expect(standings.status).toBe(200);
    const ada1 = standings.body.entries.find((e: { nickname: string }) => e.nickname === 'ada');
    expect(ada1).toBeTruthy();
    expect(ada1.games).toBe(1);
    expect(ada1.rank).toBe(1);
  });

  it('join rejects a bad code', async () => {
    const ada = await makeAccount('ada');
    expect((await ada.post('/api/groups/join').send({ code: 'ZZZZZ' })).status).toBe(404);
  });
});
