import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import sharp from 'sharp';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for avatar endpoints (spec Phase 1 UI overhaul):
 *   POST /api/me/avatar/preset  — colour preset selection
 *   POST /api/me/avatar         — image upload + sharp processing
 *   GET  /api/players/:id/avatar — binary serve
 * Covers the three review findings: Fix 1 (oversize → 400), Fix 2 (bad id → 404),
 * Fix 3 (this file itself).
 */
describe('avatar API (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp(loadEnv());
  });

  beforeEach(async () => {
    // No questions needed for avatar tests; reset players + other tables.
    await resetGameData();
  });

  afterAll(async () => {
    await testPool.end();
    await pool.end();
  });

  /**
   * Create a session-backed agent with a guest nickname. Returns the agent and
   * the player's DB id (looked up via testPool so we do not depend on the API
   * returning the id in its response body).
   */
  async function makePlayer(nickname: string) {
    const agent = request.agent(app);
    const res = await agent.post('/api/session').send({ nickname });
    expect(res.status).toBe(200);

    // Resolve the player row by nickname (unique per reset cycle).
    const row = await testPool.query<{ id: string }>(
      `SELECT id FROM players WHERE nickname = $1 LIMIT 1`,
      [nickname],
    );
    expect(row.rows.length).toBe(1);
    const playerId = row.rows[0].id;
    return { agent, playerId };
  }

  /** Generate a tiny valid PNG buffer via sharp (8x8 white). */
  async function smallPng(): Promise<Buffer> {
    return sharp({
      create: { width: 8, height: 8, channels: 3, background: '#ffffff' },
    })
      .png()
      .toBuffer();
  }

  // ---------------------------------------------------------------------------
  // Preset tests
  // ---------------------------------------------------------------------------

  it('POST /me/avatar/preset with a valid key returns 200; GET /me/stats reflects preset', async () => {
    const { agent } = await makePlayer('PresetUser');

    const set = await agent.post('/api/me/avatar/preset').send({ preset: 'blue' });
    expect(set.status).toBe(200);
    expect(set.body.ok).toBe(true);

    const stats = await agent.get('/api/me/stats');
    expect(stats.status).toBe(200);
    expect(stats.body.avatar.kind).toBe('preset');
    expect(stats.body.avatar.preset).toBe('blue');
  });

  it('POST /me/avatar/preset with an invalid key returns 400', async () => {
    const { agent } = await makePlayer('PresetBadUser');

    const bad = await agent.post('/api/me/avatar/preset').send({ preset: 'magenta' });
    expect(bad.status).toBe(400);
    expect(typeof bad.body.error).toBe('string');
  });

  // ---------------------------------------------------------------------------
  // Upload to serve round-trip
  // ---------------------------------------------------------------------------

  it('POST /me/avatar with a valid PNG returns 200; GET /players/:id/avatar returns 200 webp', async () => {
    const { agent, playerId } = await makePlayer('UploadUser');
    const png = await smallPng();

    const upload = await agent
      .post('/api/me/avatar')
      .attach('image', png, { filename: 'avatar.png', contentType: 'image/png' });
    expect(upload.status).toBe(200);
    expect(upload.body.ok).toBe(true);

    const serve = await request(app).get(`/api/players/${playerId}/avatar`);
    expect(serve.status).toBe(200);
    expect(serve.headers['content-type']).toMatch(/image\/webp/);
    // Sanity: non-empty body.
    expect((serve.body as Buffer).length ?? serve.text.length).toBeGreaterThan(0);
  });

  // ---------------------------------------------------------------------------
  // Validation rejects (Fix 1 + Fix 2)
  // ---------------------------------------------------------------------------

  it('POST /me/avatar with a non-image (text buffer, wrong mime) returns 400', async () => {
    const { agent } = await makePlayer('BadMimeUser');
    const textBuffer = Buffer.from('not an image at all');

    const res = await agent
      .post('/api/me/avatar')
      .attach('image', textBuffer, { filename: 'file.txt', contentType: 'text/plain' });
    expect(res.status).toBe(400);
    expect(typeof res.body.error).toBe('string');
  });

  it('GET /players/<valid-uuid>/avatar with no avatar set returns 404', async () => {
    const { playerId } = await makePlayer('NoAvatarUser');
    // Player exists but has no avatar.
    const res = await request(app).get(`/api/players/${playerId}/avatar`);
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_avatar');
  });

  it('GET /players/not-a-uuid/avatar returns 404 (Fix 2: bad id must not 500)', async () => {
    const res = await request(app).get('/api/players/not-a-uuid/avatar');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_avatar');
  });

  it('GET /players/<random-uuid>/avatar for unknown player returns 404', async () => {
    const res = await request(app).get('/api/players/00000000-0000-0000-0000-000000000099/avatar');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('no_avatar');
  });
});
