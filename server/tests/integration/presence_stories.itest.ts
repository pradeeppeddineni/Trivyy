import { describe, it, expect, beforeAll, beforeEach, afterAll } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';
import { createApp } from '../../src/app';
import { loadEnv } from '../../src/config/env';
import { pool } from '../../src/db/pool';
import { resetGameData, testPool } from './setup';

/**
 * DB-backed integration tests for presence (POST /api/presence/ping) and
 * stories (POST /api/stories, GET /api/stories/friends), plus the extended
 * GET /api/friends response (online, hasStory, avatar — Phase 2 UI overhaul).
 */
describe('presence + stories API (integration)', () => {
  let app: Express;

  beforeAll(() => {
    app = createApp(loadEnv());
  });

  beforeEach(async () => {
    await resetGameData();
  });

  afterAll(async () => {
    await testPool.end();
    await pool.end();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /** Create a registered account agent. Returns agent + account id. */
  async function makeAccount(username: string) {
    const agent = request.agent(app);
    const reg = await agent.post('/api/auth/register').send({ username, password: 'password1' });
    expect(reg.status).toBe(201);
    const account = reg.body.account as { id: string; inviteCode: string };
    return { agent, account };
  }

  /** Make two registered accounts that are accepted friends of each other. */
  async function makeFriends(usernameA: string, usernameB: string) {
    const a = await makeAccount(usernameA);
    const b = await makeAccount(usernameB);

    // A sends a request to B; B accepts.
    const req = await a.agent.post('/api/friends/requests').send({ username: usernameB });
    expect(req.body.status).toBe('pending');
    const incoming = await b.agent.get('/api/friends/requests');
    const reqId: string = incoming.body.requests[0].id;
    expect((await b.agent.post(`/api/friends/requests/${reqId}/accept`)).status).toBe(200);

    return { a, b };
  }

  // ---------------------------------------------------------------------------
  // Presence — ping
  // ---------------------------------------------------------------------------

  it('POST /api/presence/ping returns 401 for a guest (no session.playerId)', async () => {
    const res = await request(app).post('/api/presence/ping');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('not_signed_in');
  });

  it('POST /api/presence/ping sets last_seen_at and friend shows online', async () => {
    const { a, b } = await makeFriends('ping_ada', 'ping_bob');

    // Before ping: ada's last_seen_at is null → bob should see her as offline.
    const beforeFriends = await b.agent.get('/api/friends');
    expect(beforeFriends.status).toBe(200);
    const adaBefore = beforeFriends.body.friends.find(
      (f: { username: string }) => f.username === 'ping_ada',
    );
    expect(adaBefore.online).toBe(false);

    // Ada pings.
    const ping = await a.agent.post('/api/presence/ping');
    expect(ping.status).toBe(200);
    expect(ping.body.ok).toBe(true);

    // Verify last_seen_at updated in DB.
    const row = await testPool.query<{ last_seen_at: string | null }>(
      `SELECT last_seen_at FROM players WHERE id = $1`,
      [a.account.id],
    );
    expect(row.rows[0].last_seen_at).not.toBeNull();

    // Bob now sees ada as online.
    const afterFriends = await b.agent.get('/api/friends');
    const adaAfter = afterFriends.body.friends.find(
      (f: { username: string }) => f.username === 'ping_ada',
    );
    expect(adaAfter.online).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Stories — post + feed
  // ---------------------------------------------------------------------------

  it('POST /api/stories returns 401 for a guest', async () => {
    const res = await request(app).post('/api/stories').send({ label: 'Test Badge' });
    expect(res.status).toBe(401);
  });

  it('POST /api/stories rejects an empty label', async () => {
    const { a } = await makeFriends('story_ada1', 'story_bob1');
    const res = await a.agent.post('/api/stories').send({ label: '' });
    expect(res.status).toBe(400);
  });

  it('POST /api/stories → story appears in GET /api/stories/friends for a friend', async () => {
    const { a, b } = await makeFriends('story_ada2', 'story_bob2');

    const post = await a.agent.post('/api/stories').send({
      label: 'Geography Master',
      detail: '10/10 correct',
    });
    expect(post.status).toBe(201);
    expect(post.body.story.label).toBe('Geography Master');
    expect(post.body.story.kind).toBe('badge');

    // Bob can see it.
    const feed = await b.agent.get('/api/stories/friends');
    expect(feed.status).toBe(200);
    const storyLabels: string[] = feed.body.stories.map((s: { label: string }) => s.label);
    expect(storyLabels).toContain('Geography Master');

    // The story entry includes poster metadata.
    const geog = feed.body.stories.find((s: { label: string }) => s.label === 'Geography Master');
    expect(geog.nickname).toBeTruthy();
    expect(['none', 'preset', 'upload']).toContain(geog.avatarKind);
  });

  it('POST /api/stories with the same label does not duplicate in the feed', async () => {
    const { a, b } = await makeFriends('story_ada3', 'story_bob3');

    await a.agent.post('/api/stories').send({ label: 'Science Whiz' });
    await a.agent.post('/api/stories').send({ label: 'Science Whiz' }); // re-share

    const feed = await b.agent.get('/api/stories/friends');
    const count = feed.body.stories.filter(
      (s: { label: string }) => s.label === 'Science Whiz',
    ).length;
    expect(count).toBe(1);
  });

  it('expired stories do not appear in the feed', async () => {
    const { a, b } = await makeFriends('story_ada4', 'story_bob4');

    // Insert a story directly into DB with a past expires_at.
    await testPool.query(
      `INSERT INTO stories (player_id, kind, label, detail, expires_at)
       VALUES ($1, 'badge', 'Old Badge', NULL, now() - interval '1 second')`,
      [a.account.id],
    );

    const feed = await b.agent.get('/api/stories/friends');
    expect(feed.status).toBe(200);
    const labels: string[] = feed.body.stories.map((s: { label: string }) => s.label);
    expect(labels).not.toContain('Old Badge');
  });

  it('GET /api/stories/friends returns 401 for a guest', async () => {
    const res = await request(app).get('/api/stories/friends');
    expect(res.status).toBe(401);
  });

  // ---------------------------------------------------------------------------
  // Extended friends list — online / hasStory / avatar
  // ---------------------------------------------------------------------------

  it('GET /api/friends includes online, hasStory, and avatar fields', async () => {
    const { a, b } = await makeFriends('ext_ada', 'ext_bob');

    // Bob posts a story; ada pings.
    await b.agent.post('/api/stories').send({ label: 'History Buff' });
    await a.agent.post('/api/presence/ping');

    // Ada sees her friends list.
    const adaFriends = await a.agent.get('/api/friends');
    expect(adaFriends.status).toBe(200);
    const bob = adaFriends.body.friends.find((f: { username: string }) => f.username === 'ext_bob');

    expect(typeof bob.online).toBe('boolean');
    expect(bob.hasStory).toBe(true);
    expect(bob.avatar).toMatchObject({ kind: expect.any(String) });
    expect(['none', 'preset', 'upload']).toContain(bob.avatar.kind);

    // Bob sees ada; she pinged so she's online.
    const bobFriends = await b.agent.get('/api/friends');
    const ada = bobFriends.body.friends.find((f: { username: string }) => f.username === 'ext_ada');
    expect(ada.online).toBe(true);
    expect(ada.hasStory).toBe(false);
  });
});
