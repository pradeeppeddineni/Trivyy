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

/**
 * Get-or-create the players row backing the current session. `sessionId` is
 * `req.sessionID`; `nickname` is the session nickname. Returns the player id a
 * game needs. Idempotent on the unique `session_token`.
 */
export async function getOrCreatePlayer(sessionId: string, nickname: string): Promise<PlayerRow> {
  const result = await pool.query<PlayerRow>(
    `INSERT INTO players (nickname, session_token)
     VALUES ($1, $2)
     ON CONFLICT (session_token)
     DO UPDATE SET nickname = EXCLUDED.nickname
     RETURNING id, nickname`,
    [nickname, sessionId],
  );
  return result.rows[0];
}
