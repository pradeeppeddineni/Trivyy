import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { makeApp } from './helpers';

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
