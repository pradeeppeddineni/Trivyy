import { pool } from '../db/pool';

/**
 * Player persistence (spec 7, players table). A player is identified by a
 * nickname plus the browser session (SEC-3) — no account. The session id is the
 * stable key (`session_token`), so re-running this for the same session updates
 * the nickname rather than creating a duplicate row.
 */
export interface PlayerRow {
  readonly id: string;
  readonly nickname: string;
}

export interface PlayerMeta {
  readonly ip?: string | null;
  readonly country?: string | null;
}

/**
 * Get-or-create the players row backing the current session. `sessionId` is
 * `req.sessionID`; `nickname` is the session nickname. Returns the player id a
 * game needs. Idempotent on the unique `session_token`.
 *
 * Optional `meta` (ip/country from Cloudflare) is captured for admin analytics
 * and `last_seen_at` is refreshed every call. COALESCE keeps existing values
 * when a later call has no meta, so the location is never wiped.
 */
export async function getOrCreatePlayer(
  sessionId: string,
  nickname: string,
  meta: PlayerMeta = {},
): Promise<PlayerRow> {
  const result = await pool.query<PlayerRow>(
    `INSERT INTO players (nickname, session_token, ip, country)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (session_token)
     DO UPDATE SET nickname = EXCLUDED.nickname,
                   ip = COALESCE(EXCLUDED.ip, players.ip),
                   country = COALESCE(EXCLUDED.country, players.country),
                   last_seen_at = now()
     RETURNING id, nickname`,
    [nickname, sessionId, meta.ip ?? null, meta.country ?? null],
  );
  return result.rows[0];
}

/**
 * Load a player by id (a registered, signed-in player), refreshing location +
 * last_seen_at. Returns null if the id no longer exists. Used by
 * resolveCurrentPlayer when the session carries a `playerId`.
 */
export async function getPlayerById(id: string, meta: PlayerMeta = {}): Promise<PlayerRow | null> {
  const result = await pool.query<PlayerRow>(
    `UPDATE players
        SET ip = COALESCE($2, ip),
            country = COALESCE($3, country),
            last_seen_at = now()
      WHERE id = $1 AND is_registered = true
      RETURNING id, nickname`,
    [id, meta.ip ?? null, meta.country ?? null],
  );
  return result.rows[0] ?? null;
}
