import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { generateGameCode } from '../domain/gameCode';
import { GameError } from './gameService';

/**
 * Persistent groups ("clubs") — spec v3 §13.3. A named, owned set of players
 * with a reusable join code (distinct from a single-use game code, SEC-4). The
 * same group re-plays via rematch; standings aggregate across the group's games
 * (derived, API-8). Distinct from groupService.ts (per-game `together` lobby).
 * No Express types here (ARC-2).
 */

export interface Group {
  readonly id: string;
  readonly name: string;
  readonly code: string;
  readonly memberCount: number;
  readonly isOwner: boolean;
}

export interface GroupMember {
  readonly nickname: string;
  readonly username: string | null;
  readonly isOwner: boolean;
}

async function allocateGroupCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateGameCode();
    const taken = await pool.query(`SELECT 1 FROM groups WHERE code = $1`, [code]);
    if (taken.rows.length === 0) {
      return code;
    }
  }
  throw new GameError('could_not_allocate_group_code', 500);
}

async function assertMember(groupId: string, playerId: string): Promise<void> {
  const m = await pool.query(
    `SELECT 1 FROM group_members WHERE group_id = $1 AND player_id = $2 LIMIT 1`,
    [groupId, playerId],
  );
  if (m.rows.length === 0) {
    throw new GameError('not_in_group', 403);
  }
}

/** Create a group; the creator becomes the owner member. */
export async function createGroup(
  ownerId: string,
  name: string,
): Promise<{ id: string; name: string; code: string }> {
  const code = await allocateGroupCode();
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const g = await client.query<{ id: string }>(
      `INSERT INTO groups (name, code, owner_id) VALUES ($1, $2, $3) RETURNING id`,
      [name.trim(), code, ownerId],
    );
    const groupId = g.rows[0].id;
    await client.query(
      `INSERT INTO group_members (group_id, player_id, role) VALUES ($1, $2, 'owner')`,
      [groupId, ownerId],
    );
    await client.query('COMMIT');
    logger.info('group_created', { groupId });
    return { id: groupId, name: name.trim(), code };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/** Join a group by code (idempotent if already a member). */
export async function joinGroup(playerId: string, code: string): Promise<{ groupId: string }> {
  const g = await pool.query<{ id: string }>(`SELECT id FROM groups WHERE code = $1`, [
    code.trim().toUpperCase(),
  ]);
  if (g.rows.length === 0) {
    throw new GameError('group_not_found', 404);
  }
  const groupId = g.rows[0].id;
  await pool.query(
    `INSERT INTO group_members (group_id, player_id, role) VALUES ($1, $2, 'member')
     ON CONFLICT (group_id, player_id) DO NOTHING`,
    [groupId, playerId],
  );
  logger.info('group_joined', { groupId });
  return { groupId };
}

/** Groups the player belongs to, with member counts. */
export async function listMyGroups(playerId: string): Promise<ReadonlyArray<Group>> {
  const result = await pool.query<{
    id: string;
    name: string;
    code: string;
    owner_id: string;
    members: string;
  }>(
    `SELECT g.id, g.name, g.code, g.owner_id,
            (SELECT count(*) FROM group_members gm2 WHERE gm2.group_id = g.id) AS members
       FROM groups g
       JOIN group_members gm ON gm.group_id = g.id AND gm.player_id = $1
      ORDER BY g.created_at DESC`,
    [playerId],
  );
  return result.rows.map((r) => ({
    id: r.id,
    name: r.name,
    code: r.code,
    memberCount: Number(r.members),
    isOwner: r.owner_id === playerId,
  }));
}

export interface GroupDetail extends Group {
  readonly members: ReadonlyArray<GroupMember>;
}

/** Group detail + members (members only). */
export async function getGroup(playerId: string, groupId: string): Promise<GroupDetail> {
  const g = await pool.query<{ id: string; name: string; code: string; owner_id: string }>(
    `SELECT id, name, code, owner_id FROM groups WHERE id = $1`,
    [groupId],
  );
  if (g.rows.length === 0) {
    throw new GameError('group_not_found', 404);
  }
  await assertMember(groupId, playerId);
  const row = g.rows[0];
  const members = await pool.query<{
    nickname: string;
    username: string | null;
    player_id: string;
  }>(
    `SELECT p.nickname, p.username, gm.player_id
       FROM group_members gm JOIN players p ON p.id = gm.player_id
      WHERE gm.group_id = $1
      ORDER BY (gm.player_id = $2) DESC, p.nickname ASC`,
    [groupId, row.owner_id],
  );
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    memberCount: members.rows.length,
    isOwner: row.owner_id === playerId,
    members: members.rows.map((m) => ({
      nickname: m.nickname,
      username: m.username,
      isOwner: m.player_id === row.owner_id,
    })),
  };
}

export interface StandingEntry {
  readonly rank: number;
  readonly nickname: string;
  readonly points: number;
  readonly games: number;
}

/**
 * Group standings: cumulative points across all the group's finished games,
 * derived on read (API-8). Ties share a rank. Members only.
 */
export async function getStandings(
  playerId: string,
  groupId: string,
): Promise<ReadonlyArray<StandingEntry>> {
  await assertMember(groupId, playerId);
  const result = await pool.query<{ nickname: string; points: string; games: string }>(
    `SELECT p.nickname,
            COALESCE(SUM(gp.score), 0) AS points,
            COUNT(gp.id) FILTER (WHERE gp.status = 'done') AS games
       FROM group_members gm
       JOIN players p ON p.id = gm.player_id
       LEFT JOIN games g ON g.group_id = $1
       LEFT JOIN game_players gp ON gp.game_id = g.id AND gp.player_id = p.id AND gp.status = 'done'
      WHERE gm.group_id = $1
      GROUP BY p.id, p.nickname
      ORDER BY points DESC, p.nickname ASC`,
    [groupId],
  );
  let lastPoints: number | null = null;
  let lastRank = 0;
  return result.rows.map((r, index) => {
    const points = Number(r.points);
    const rank = lastPoints !== null && points === lastPoints ? lastRank : index + 1;
    lastPoints = points;
    lastRank = rank;
    return { rank, nickname: r.nickname, points, games: Number(r.games) };
  });
}
