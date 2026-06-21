import { pool } from '../db/pool';

/**
 * Story service (spec Phase 2 UI overhaul). Stories are 24-hour trivia-badge
 * shares visible to the poster and their accepted friends. No Express types (ARC-2).
 *
 * Deduplication: posting the same label replaces any existing active story with
 * that label so re-sharing a badge does not stack up in the feed.
 */

export interface Story {
  readonly id: string;
  readonly playerId: string;
  readonly kind: string;
  readonly label: string;
  readonly detail: string | null;
  readonly createdAt: string;
  readonly expiresAt: string;
}

export interface FriendStory extends Story {
  readonly nickname: string;
  readonly avatarKind: 'none' | 'preset' | 'upload';
  readonly avatarPreset: string | null;
}

interface StoryRow {
  id: string;
  player_id: string;
  kind: string;
  label: string;
  detail: string | null;
  created_at: string;
  expires_at: string;
}

interface FriendStoryRow extends StoryRow {
  nickname: string;
  avatar_preset: string | null;
  has_image: boolean;
}

const toStory = (r: StoryRow): Story => ({
  id: r.id,
  playerId: r.player_id,
  kind: r.kind,
  label: r.label,
  detail: r.detail,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
});

const toFriendStory = (r: FriendStoryRow): FriendStory => ({
  ...toStory(r),
  nickname: r.nickname,
  avatarKind: r.has_image ? 'upload' : r.avatar_preset ? 'preset' : 'none',
  avatarPreset: r.avatar_preset,
});

/**
 * Post a badge story for `playerId`. Any existing active story from this player
 * with the same label is deleted first so re-sharing does not duplicate entries.
 * `kind` is always 'badge' for now (the column is reserved for future kinds).
 */
export async function postStory(
  playerId: string,
  data: { label: string; detail?: string },
): Promise<Story> {
  // Remove any active story with the same (player_id, label) before inserting
  // so the feed never shows duplicates for the same badge.
  await pool.query(
    `DELETE FROM stories
      WHERE player_id = $1 AND label = $2 AND expires_at > now()`,
    [playerId, data.label],
  );

  const result = await pool.query<StoryRow>(
    `INSERT INTO stories (player_id, kind, label, detail, expires_at)
     VALUES ($1, 'badge', $2, $3, now() + interval '24 hours')
     RETURNING id, player_id, kind, label, detail,
               created_at::text, expires_at::text`,
    [playerId, data.label, data.detail ?? null],
  );

  return toStory(result.rows[0]);
}

/**
 * Active stories from `meId` and their accepted friends, newest first.
 * Joined to each poster's nickname and avatar meta so the feed can render
 * without extra round-trips.
 */
export async function listFriendStories(meId: string): Promise<ReadonlyArray<FriendStory>> {
  const result = await pool.query<FriendStoryRow>(
    `WITH circle AS (
       SELECT $1::uuid AS id
       UNION
       SELECT CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
         FROM friendships f
        WHERE f.status = 'accepted' AND $1 IN (f.requester_id, f.addressee_id)
     )
     SELECT s.id, s.player_id, s.kind, s.label, s.detail,
            s.created_at::text, s.expires_at::text,
            p.nickname,
            p.avatar_preset,
            (p.avatar_image IS NOT NULL) AS has_image
       FROM stories s
       JOIN circle c ON c.id = s.player_id
       JOIN players p ON p.id = s.player_id
      WHERE s.expires_at > now()
      ORDER BY s.created_at DESC`,
    [meId],
  );
  return result.rows.map(toFriendStory);
}

/**
 * The caller's own active (non-expired) stories, newest first.
 */
export async function myActiveStories(meId: string): Promise<ReadonlyArray<Story>> {
  const result = await pool.query<StoryRow>(
    `SELECT id, player_id, kind, label, detail,
            created_at::text, expires_at::text
       FROM stories
      WHERE player_id = $1 AND expires_at > now()
      ORDER BY created_at DESC`,
    [meId],
  );
  return result.rows.map(toStory);
}
