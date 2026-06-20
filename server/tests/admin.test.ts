import { describe, it, expect, beforeAll } from 'vitest';
import argon2 from 'argon2';
import request from 'supertest';
import { makeApp } from './helpers';

const PASSWORD = 'correct horse battery staple';
let passwordHash: string;

beforeAll(async () => {
  passwordHash = await argon2.hash(PASSWORD);
});

describe('admin auth', () => {
  it('rejects a login with no password', async () => {
    const app = makeApp({ ADMIN_PASSWORD_HASH: passwordHash });
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(400);
  });

  it('rejects a wrong password', async () => {
    const app = makeApp({ ADMIN_PASSWORD_HASH: passwordHash });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'nope' });
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid_credentials' });
  });

  it('rejects a wrong username', async () => {
    const app = makeApp({ ADMIN_PASSWORD_HASH: passwordHash });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'nobody', password: PASSWORD });
    expect(res.status).toBe(401);
  });

  it('blocks admin-only routes when not logged in', async () => {
    const app = makeApp({ ADMIN_PASSWORD_HASH: passwordHash });
    const res = await request(app).get('/api/admin/whoami');
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'unauthorized' });
  });

  it('accepts the correct password and grants access to admin-only routes', async () => {
    const agent = request.agent(makeApp({ ADMIN_PASSWORD_HASH: passwordHash }));

    const login = await agent
      .post('/api/admin/login')
      .send({ username: 'admin', password: PASSWORD });
    expect(login.status).toBe(200);
    expect(login.body).toEqual({ ok: true });

    const who = await agent.get('/api/admin/whoami');
    expect(who.status).toBe(200);
    expect(who.body).toEqual({ role: 'admin' });
  });

  it('logs out', async () => {
    const agent = request.agent(makeApp({ ADMIN_PASSWORD_HASH: passwordHash }));
    await agent.post('/api/admin/login').send({ username: 'admin', password: PASSWORD });
    const logout = await agent.post('/api/admin/logout');
    expect(logout.status).toBe(200);
    const who = await agent.get('/api/admin/whoami');
    expect(who.status).toBe(401);
  });

  it('returns a generic 500 (no internals leaked) when the stored hash is malformed', async () => {
    const app = makeApp({ ADMIN_PASSWORD_HASH: 'not-a-valid-argon2-hash' });
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: PASSWORD });
    expect(res.status).toBe(500);
    expect(res.body).toEqual({ error: 'internal_server_error' });
  });
});
