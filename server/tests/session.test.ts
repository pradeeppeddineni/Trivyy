import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

// The session route upserts a players row (DB I/O). Unit tests stay DB-free, so
// the player service is mocked here; the real DB behavior is covered by the
// integration suite (tests/integration). This keeps `npm test` runnable with no
// database, per the Phase 2 plan.
vi.mock('../src/services/playerService', () => ({
  getOrCreatePlayer: vi.fn(async () => ({ id: 'test-player-id', nickname: 'mock' })),
}));

describe('player session', () => {
  it('sets a nickname and returns it', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/session').send({ nickname: 'Ada' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nickname: 'Ada' });
  });

  it('rejects an empty nickname', async () => {
    const app = makeApp();
    const res = await request(app).post('/api/session').send({ nickname: '' });
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid_nickname' });
  });

  it('rejects an over-long nickname', async () => {
    const app = makeApp();
    const res = await request(app)
      .post('/api/session')
      .send({ nickname: 'x'.repeat(21) });
    expect(res.status).toBe(400);
  });

  it('returns 401 from /me without a session', async () => {
    const app = makeApp();
    const res = await request(app).get('/api/me');
    expect(res.status).toBe(401);
  });

  it('remembers the nickname across requests in the same session', async () => {
    const agent = request.agent(makeApp());
    await agent.post('/api/session').send({ nickname: 'Grace' });
    const res = await agent.get('/api/me');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ nickname: 'Grace' });
  });
});
