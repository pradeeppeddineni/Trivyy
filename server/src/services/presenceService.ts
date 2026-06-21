import { pool } from '../db/pool';

/**
 * Presence service (spec Phase 2 UI overhaul). Tracks when a player was last
 * seen via a lightweight periodic ping from the client. No Express types (ARC-2).
 *
 * Online window: 2 minutes. Short enough to detect gone-offline quickly;
 * long enough not to flicker on typical polling intervals.
 */

const ONLINE_WINDOW_MS = 2 * 60 * 1000;

/**
 * Pure helper — whether `lastSeen` falls within the online window.
 * Exported so unit tests can verify boundary behaviour without a DB.
 *
 * @param lastSeen - Timestamp from the players.last_seen_at column, or null.
 * @param nowMs    - Reference time in ms-since-epoch; defaults to Date.now().
 */
export function isOnline(lastSeen: Date | string | null, nowMs?: number): boolean {
  if (lastSeen === null) return false;
  const seenMs = typeof lastSeen === 'string' ? new Date(lastSeen).getTime() : lastSeen.getTime();
  const now = nowMs ?? Date.now();
  return now - seenMs < ONLINE_WINDOW_MS;
}

/**
 * Record that `playerId` is currently active by setting their `last_seen_at`
 * to the current database time. Safe to call on every presence ping.
 */
export async function touch(playerId: string): Promise<void> {
  await pool.query(`UPDATE players SET last_seen_at = now() WHERE id = $1`, [playerId]);
}
