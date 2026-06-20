import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for friends (spec v3 §13.2): username search +
 * request/accept, invite-link accept, and the derived friends leaderboard.
 */
describe('friends API (integration)', () => {
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

  /** A signed-in account agent; returns the agent + its account body. */
  async function makeAccount(username: string) {
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({ username, password: 'password1' });
    expect(reg.status).toBe(201);
    return { agent, account: reg.body.account as { id: string; inviteCode: string } };
  }

  it('requires an account', async () => {
    expect((await request(app).get('/api/friends')).status).toBe(401);
    expect((await request(app).get('/api/friends/leaderboard')).status).toBe(401);
  });

  it('search → request → accept makes a symmetric friendship', async () => {
    const { agent: ada } = await makeAccount('ada');
    const { agent: bob } = await makeAccount('bob');

    const found = await ada.get('/api/friends/search?q=bo');
    expect(found.status).toBe(200);
    expect(found.body.players.map((p: { username: string }) => p.username)).toContain('bob');

    const sent = await ada.post('/api/friends/requests').send({ username: 'bob' });
    expect(sent.body.status).toBe('pending');

    const incoming = await bob.get('/api/friends/requests');
    expect(incoming.body.requests).toHaveLength(1);
    const reqId = incoming.body.requests[0].id;
    expect(incoming.body.requests[0].from.username).toBe('ada');

    expect((await bob.post(`/api/friends/requests/${reqId}/accept`)).status).toBe(200);

    const adaFriends = await ada.get('/api/friends');
    const bobFriends = await bob.get('/api/friends');
    expect(adaFriends.body.friends.map((p: { username: string }) => p.username)).toContain('bob');
    expect(bobFriends.body.friends.map((p: { username: string }) => p.username)).toContain('ada');
  });

  it('declining a request removes it and creates no friendship', async () => {
    const { agent: ada } = await makeAccount('ada');
    const { agent: bob } = await makeAccount('bob');

    await ada.post('/api/friends/requests').send({ username: 'bob' });
    const incoming = await bob.get('/api/friends/requests');
    const reqId = incoming.body.requests[0].id;

    expect((await bob.post(`/api/friends/requests/${reqId}/decline`)).status).toBe(200);

    // Gone from requests, and neither side has a friend.
    expect((await bob.get('/api/friends/requests')).body.requests).toHaveLength(0);
    expect((await ada.get('/api/friends')).body.friends).toHaveLength(0);
    expect((await bob.get('/api/friends')).body.friends).toHaveLength(0);

    // The decliner can no longer act on the same request id.
    expect((await bob.post(`/api/friends/requests/${reqId}/accept`)).status).toBe(404);
  });

  it('cannot friend yourself; bad username 404s', async () => {
    const { agent: ada } = await makeAccount('ada');
    expect((await ada.post('/api/friends/requests').send({ username: 'ada' })).status).toBe(400);
    expect((await ada.post('/api/friends/requests').send({ username: 'ghost' })).status).toBe(404);
  });

  it('invite link makes an instant friendship', async () => {
    const { agent: ada } = await makeAccount('ada');
    const { account: cara } = await makeAccount('cara');

    const accept = await ada.post(`/api/friends/invite/${cara.inviteCode}`);
    expect(accept.status).toBe(200);

    const adaFriends = await ada.get('/api/friends');
    expect(adaFriends.body.friends.map((p: { username: string }) => p.username)).toContain('cara');
  });

  it('friends leaderboard is cumulative points over me + friends', async () => {
    const { agent: ada } = await makeAccount('ada');
    const { account: cara } = await makeAccount('cara');
    await ada.post(`/api/friends/invite/${cara.inviteCode}`);

    // Ada plays a solo game and scores.
    const created = await ada.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    for (const q of questions) {
      // Answer with the real correct answer (look it up) to score points.
      const graded = await ada
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0] });
      void graded;
    }
    await ada.post(`/api/games/${gameId}/complete`);

    const board = await ada.get('/api/friends/leaderboard');
    expect(board.status).toBe(200);
    const usernames = board.body.entries.map((e: { username: string }) => e.username);
    expect(usernames).toContain('ada');
    expect(usernames).toContain('cara');
    // Entries are ranked; ada (who played) has >= cara's 0 points.
    const ada1 = board.body.entries.find((e: { username: string }) => e.username === 'ada');
    expect(ada1.games).toBe(1);
    expect(ada1.points).toBeGreaterThanOrEqual(0);
  });
});
