import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { seedQuestions, resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for optional accounts (spec v3 §13.1): register,
 * login, /me, reset with recovery code, and guest-upgrade-keeps-history.
 */
describe('accounts API (integration)', () => {
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

  it('registers, returns a one-time recovery code, and authenticates', async () => {
    const agent = request.agent(app);
    const reg = await agent
      .post('/api/auth/register')
      .send({ username: 'Ada_Lovelace', password: 'correct horse', nickname: 'Ada' });
    expect(reg.status).toBe(201);
    expect(reg.body.account.username).toBe('ada_lovelace'); // normalized lowercase
    expect(reg.body.account.nickname).toBe('Ada');
    expect(reg.body.account.inviteCode).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/);
    expect(typeof reg.body.recoveryCode).toBe('string');
    expect(reg.body.recoveryCode.length).toBeGreaterThanOrEqual(16);

    // The same agent is signed in.
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body.account.username).toBe('ada_lovelace');
  });

  it('rejects a duplicate username (case-insensitive) and a bad login', async () => {
    const a = request.agent(app);
    await a.post('/api/auth/register').send({ username: 'sam', password: 'password1' });

    const dup = await request(app)
      .post('/api/auth/register')
      .send({ username: 'SAM', password: 'password2' });
    expect(dup.status).toBe(409);

    const bad = await request(app)
      .post('/api/auth/login')
      .send({ username: 'sam', password: 'wrongpass' });
    expect(bad.status).toBe(401);

    const ok = await request(app)
      .post('/api/auth/login')
      .send({ username: 'SAM', password: 'password1' });
    expect(ok.status).toBe(200);
  });

  it('resets the password with the recovery code, then logs in with the new one', async () => {
    const agent = request.agent(app);
    const reg = await agent
      .post('/api/auth/register')
      .send({ username: 'rey', password: 'oldpassword' });
    const code = reg.body.recoveryCode as string;

    const wrong = await request(app)
      .post('/api/auth/reset')
      .send({ username: 'rey', recoveryCode: 'WRNG-WRNG-WRNG-WRNG', newPassword: 'newpassword' });
    expect(wrong.status).toBe(401);

    const reset = await request(app)
      .post('/api/auth/reset')
      .send({ username: 'rey', recoveryCode: code, newPassword: 'newpassword' });
    expect(reset.status).toBe(200);

    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'rey', password: 'oldpassword' })
      ).status,
    ).toBe(401);
    expect(
      (
        await request(app)
          .post('/api/auth/login')
          .send({ username: 'rey', password: 'newpassword' })
      ).status,
    ).toBe(200);
  });

  it('upgrades a guest in place, preserving game history', async () => {
    const agent = request.agent(app);
    // Play a solo game as a guest first.
    await agent.post('/api/session').send({ nickname: 'Guesty' });
    const created = await agent.post('/api/games').send({ mode: 'solo', count: 5 });
    const { gameId, questions } = created.body;
    for (const q of questions) {
      await agent
        .post(`/api/games/${gameId}/answers`)
        .send({ questionId: q.id, selectedAnswer: q.choices[0] });
    }
    await agent.post(`/api/games/${gameId}/complete`);

    // Now register on the same session.
    const reg = await agent
      .post('/api/auth/register')
      .send({ username: 'guesty', password: 'password1' });
    expect(reg.status).toBe(201);
    expect(reg.body.account.nickname).toBe('Guesty'); // kept the guest nickname

    // The completed game's result is still attributed to this player.
    const result = await agent.get(`/api/games/${gameId}/result`);
    expect(result.status).toBe(200);
    expect(result.body.total).toBe(5);

    // Exactly one player row exists (upgraded in place, not duplicated).
    const count = await testPool.query(
      `SELECT count(*) AS n FROM players WHERE nickname = 'Guesty'`,
    );
    expect(Number(count.rows[0].n)).toBe(1);
  });

  it('requires auth for /me when only a guest', async () => {
    const agent = request.agent(app);
    await agent.post('/api/session').send({ nickname: 'Guesty' });
    const me = await agent.get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});
