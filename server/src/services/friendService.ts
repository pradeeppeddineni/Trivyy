import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { GameError } from './gameService';

/**
 * Friends (spec v3 §13.2). A friendship is one row; accepted friendship is
 * symmetric in queries. Invite links and username search both create requests;
 * the friends leaderboard is derived (API-8). No Express types here (ARC-2).
 */

export interface PlayerSummary {
  readonly id: string;
  readonly username: string;
  readonly nickname: string;
}

export interface FriendRequest {
  readonly id: string;
  readonly from: PlayerSummary;
}

interface PlayerRow {
  id: string;
  username: string | null;
  nickname: string;
}

const toSummary = (r: PlayerRow): PlayerSummary => ({
  id: r.id,
  username: r.username ?? '',
  nickname: r.nickname,
});

/** Search registered players by username prefix/substring, excluding self. */
export async function searchPlayers(
  meId: string,
  query: string,
): Promise<ReadonlyArray<PlayerSummary>> {
  const q = query.trim();
  if (q.length < 2) {
    return [];
  }
  const escaped = q.replace(/[\\%_]/g, '\\$&');
  const result = await pool.query<PlayerRow>(
    `SELECT id, username, nickname
       FROM players
      WHERE is_registered = true AND id <> $1 AND username ILIKE $2
      ORDER BY username
      LIMIT 10`,
    [meId, `%${escaped}%`],
  );
  return result.rows.map(toSummary);
}

/** Existing relationship between two players (either direction), if any. */
async function relationBetween(
  a: string,
  b: string,
): Promise<{ id: string; status: string; requester_id: string } | null> {
  const r = await pool.query<{ id: string; status: string; requester_id: string }>(
    `SELECT id, status, requester_id FROM friendships
      WHERE (requester_id = $1 AND addressee_id = $2)
         OR (requester_id = $2 AND addressee_id = $1)
      LIMIT 1`,
    [a, b],
  );
  return r.rows[0] ?? null;
}

async function findByUsername(username: string): Promise<PlayerRow | null> {
  const r = await pool.query<PlayerRow>(
    `SELECT id, username, nickname FROM players WHERE username = $1 AND is_registered = true`,
    [username.trim().toLowerCase()],
  );
  return r.rows[0] ?? null;
}

/** Send a friend request by username. Idempotent if one already exists. */
export async function sendRequest(meId: string, username: string): Promise<{ status: string }> {
  const target = await findByUsername(username);
  if (!target) {
    throw new GameError('player_not_found', 404);
  }
  if (target.id === meId) {
    throw new GameError('cannot_friend_self', 400);
  }
  const existing = await relationBetween(meId, target.id);
  if (existing) {
    // Mutual intent: if they already sent ME a pending request, accept it now
    // (both sides want it) rather than reporting a confusing second "pending".
    if (existing.status === 'pending' && existing.requester_id === target.id) {
      await pool.query(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [existing.id]);
      logger.info('friend_request_mutual_accepted', { meId });
      return { status: 'accepted' };
    }
    return { status: existing.status };
  }
  await pool.query(
    `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'pending')`,
    [meId, target.id],
  );
  logger.info('friend_request_sent', { meId });
  return { status: 'pending' };
}

/** Accept or decline an incoming request. Only the addressee may respond. */
export async function respondToRequest(
  meId: string,
  friendshipId: string,
  accept: boolean,
): Promise<void> {
  const r = await pool.query<{ addressee_id: string; status: string }>(
    `SELECT addressee_id, status FROM friendships WHERE id = $1`,
    [friendshipId],
  );
  const row = r.rows[0];
  if (!row || row.addressee_id !== meId || row.status !== 'pending') {
    throw new GameError('request_not_found', 404);
  }
  if (accept) {
    await pool.query(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [friendshipId]);
  } else {
    await pool.query(`DELETE FROM friendships WHERE id = $1`, [friendshipId]);
  }
  logger.info('friend_request_responded', { meId, accept });
}

/**
 * Accept a friend invite link (`?friend=CODE`). Both sides consent (one shared,
 * one clicked), so the friendship is created/updated straight to accepted.
 */
export async function acceptInvite(meId: string, inviteCode: string): Promise<{ ok: true }> {
  const owner = await pool.query<PlayerRow>(
    `SELECT id, username, nickname FROM players WHERE invite_code = $1 AND is_registered = true`,
    [inviteCode.trim().toUpperCase()],
  );
  const friend = owner.rows[0];
  if (!friend) {
    throw new GameError('invite_not_found', 404);
  }
  if (friend.id === meId) {
    throw new GameError('cannot_friend_self', 400);
  }
  const existing = await relationBetween(meId, friend.id);
  if (existing) {
    if (existing.status !== 'accepted') {
      await pool.query(`UPDATE friendships SET status = 'accepted' WHERE id = $1`, [existing.id]);
    }
  } else {
    await pool.query(
      `INSERT INTO friendships (requester_id, addressee_id, status) VALUES ($1, $2, 'accepted')`,
      [meId, friend.id],
    );
  }
  logger.info('friend_invite_accepted', { meId });
  return { ok: true };
}

/** Accepted friends (symmetric). */
export async function listFriends(meId: string): Promise<ReadonlyArray<PlayerSummary>> {
  const result = await pool.query<PlayerRow>(
    `SELECT p.id, p.username, p.nickname
       FROM friendships f
       JOIN players p
         ON p.id = CASE WHEN f.requester_id = $1 THEN f.addressee_id ELSE f.requester_id END
      WHERE f.status = 'accepted' AND $1 IN (f.requester_id, f.addressee_id)
      ORDER BY p.nickname`,
    [meId],
  );
  return result.rows.map(toSummary);
}

/** Incoming pending requests (I am the addressee). */
export async function listIncomingRequests(meId: string): Promise<ReadonlyArray<FriendRequest>> {
  const result = await pool.query<PlayerRow & { friendship_id: string }>(
    `SELECT f.id AS friendship_id, p.id, p.username, p.nickname
       FROM friendships f
       JOIN players p ON p.id = f.requester_id
      WHERE f.addressee_id = $1 AND f.status = 'pending'
      ORDER BY f.created_at DESC`,
    [meId],
  );
  return result.rows.map((r) => ({ id: r.friendship_id, from: toSummary(r) }));
}

export interface LeaderboardEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly username: string;
  readonly points: number;
  readonly games: number;
  readonly isMe: boolean;
}

/**
 * Friends leaderboard: cumulative points (correct answers across finished games)
 * over me + my accepted friends. Derived on read (API-8); standard competition
 * ranking with ties sharing a rank.
 */
export async function friendsLeaderboard(meId: string): Promise<ReadonlyArray<LeaderboardEntry>> {
  const result = await pool.query<{
    id: string;
    nickname: string;
    username: string | null;
    points: string;
    games: string;
  }>(
    `WITH circle AS (
       SELECT $1::uuid AS id
       UNION
       SELECT CASE WHEN requester_id = $1 THEN addressee_id ELSE requester_id END
         FROM friendships
        WHERE status = 'accepted' AND $1 IN (requester_id, addressee_id)
     )
     SELECT p.id, p.nickname, p.username,
            COALESCE(SUM(gp.score), 0) AS points,
            COUNT(gp.id) FILTER (WHERE gp.status = 'done') AS games
       FROM circle c
       JOIN players p ON p.id = c.id
       LEFT JOIN game_players gp ON gp.player_id = p.id AND gp.status = 'done'
      GROUP BY p.id, p.nickname, p.username
      ORDER BY points DESC, p.nickname ASC`,
    [meId],
  );

  let lastPoints: number | null = null;
  let lastRank = 0;
  return result.rows.map((row, index) => {
    const points = Number(row.points);
    const rank = lastPoints !== null && points === lastPoints ? lastRank : index + 1;
    lastPoints = points;
    lastRank = rank;
    return {
      rank,
      nickname: row.nickname,
      username: row.username ?? '',
      points,
      games: Number(row.games),
      isMe: row.id === meId,
    };
  });
}
