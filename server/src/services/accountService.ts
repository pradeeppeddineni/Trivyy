import argon2 from 'argon2';
import { pool } from '../db/pool';
import { logger } from '../lib/logger';
import { generateGameCode } from '../domain/gameCode';
import { generateRecoveryCode, normalizeRecoveryCode } from '../domain/recoveryCode';
import { GameError } from './gameService';

/**
 * Optional player accounts (spec v3 §13.1, SEC-3/3a). A guest is an existing
 * `players` row keyed by session_token; registering UPGRADES that row in place
 * so history is preserved. Auth is username + argon2 password; recovery is a
 * one-time argon2-hashed code (no email). No Express types here (ARC-2).
 */

export interface Account {
  readonly id: string;
  readonly nickname: string;
  readonly username: string;
  readonly inviteCode: string;
}

interface AccountRow {
  id: string;
  nickname: string;
  username: string | null;
  invite_code: string | null;
  is_registered: boolean;
}

const toAccount = (row: AccountRow): Account => ({
  id: row.id,
  nickname: row.nickname,
  username: row.username ?? '',
  inviteCode: row.invite_code ?? '',
});

/** Allocate an invite_code unique across players, retrying on collision. */
async function allocateInviteCode(): Promise<string> {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateGameCode();
    const taken = await pool.query(`SELECT 1 FROM players WHERE invite_code = $1`, [code]);
    if (taken.rows.length === 0) {
      return code;
    }
  }
  throw new GameError('could_not_allocate_invite_code', 500);
}

export interface RegisterResult {
  readonly account: Account;
  /** Shown to the user exactly once; never persisted in plaintext. */
  readonly recoveryCode: string;
}

/**
 * Register an account. If the current session already has a guest player row,
 * that row is upgraded in place (keeps nickname + history); otherwise a new
 * registered player is created. Returns the account and the one-time recovery
 * code. Throws 409 on a taken username or an already-registered session.
 */
export async function register(
  sessionId: string,
  username: string,
  password: string,
  nickname?: string,
): Promise<RegisterResult> {
  const uname = username.trim().toLowerCase();

  // No username pre-check: we rely solely on the unique index + the 23505 catch
  // below. That keeps one code path and avoids a timing oracle for "does this
  // username exist" (usernames are searchable in Phase B, but the write path
  // shouldn't be a faster existence probe than the search endpoint).
  const passwordHash = await argon2.hash(password);
  const recoveryCode = generateRecoveryCode();
  const recoveryHash = await argon2.hash(recoveryCode);
  const inviteCode = await allocateInviteCode();

  const existing = await pool.query<AccountRow>(
    `SELECT id, nickname, username, invite_code, is_registered
       FROM players WHERE session_token = $1`,
    [sessionId],
  );

  let row: AccountRow;
  try {
    if (existing.rows.length > 0) {
      if (existing.rows[0].is_registered) {
        throw new GameError('already_registered', 409);
      }
      const updated = await pool.query<AccountRow>(
        `UPDATE players
            SET username = $2, password_hash = $3, recovery_code_hash = $4,
                is_registered = true, invite_code = $5,
                nickname = COALESCE($6, nickname)
          WHERE session_token = $1
          RETURNING id, nickname, username, invite_code, is_registered`,
        [sessionId, uname, passwordHash, recoveryHash, inviteCode, nickname ?? null],
      );
      row = updated.rows[0];
    } else {
      const inserted = await pool.query<AccountRow>(
        `INSERT INTO players (nickname, session_token, username, password_hash, recovery_code_hash, is_registered, invite_code)
         VALUES ($1, $2, $3, $4, $5, true, $6)
         RETURNING id, nickname, username, invite_code, is_registered`,
        [nickname ?? uname, sessionId, uname, passwordHash, recoveryHash, inviteCode],
      );
      row = inserted.rows[0];
    }
  } catch (err) {
    // A concurrent registration can lose the pre-check race and hit the unique
    // index; surface it as the same friendly 409 rather than a 500.
    if (typeof err === 'object' && err !== null && 'code' in err && err.code === '23505') {
      throw new GameError('username_taken', 409);
    }
    throw err;
  }

  await recordAccountEvent('account_registered', row.id);
  logger.info('account_registered', { playerId: row.id });
  return { account: toAccount(row), recoveryCode };
}

/**
 * Append an account-lifecycle event to the audit trail the admin dashboard reads
 * (DB-5/OBS-3). game_id is NULL — these are player events, not game events.
 */
async function recordAccountEvent(type: string, playerId: string): Promise<void> {
  await pool.query(`INSERT INTO events (game_id, type, payload) VALUES (NULL, $1, $2)`, [
    type,
    JSON.stringify({ playerId }),
  ]);
}

/** Verify username + password; returns the account or null (no reason leaked). */
export async function login(username: string, password: string): Promise<Account | null> {
  const result = await pool.query<AccountRow & { password_hash: string | null }>(
    `SELECT id, nickname, username, invite_code, is_registered, password_hash
       FROM players WHERE username = $1 AND is_registered = true`,
    [username.trim().toLowerCase()],
  );
  const row = result.rows[0];
  if (!row || !row.password_hash) {
    return null;
  }
  const ok = await argon2.verify(row.password_hash, password);
  logger.info('account_login', { playerId: row.id, ok });
  return ok ? toAccount(row) : null;
}

/**
 * Reset a password with the recovery code. On success the code is **rotated** (a
 * fresh one is issued and the old hash replaced) so the used code can never be
 * replayed (one-time semantics), and the new code is returned to show once.
 * Returns null on a bad username/code.
 */
export async function resetPassword(
  username: string,
  recoveryCode: string,
  newPassword: string,
): Promise<{ recoveryCode: string } | null> {
  const result = await pool.query<{ id: string; recovery_code_hash: string | null }>(
    `SELECT id, recovery_code_hash FROM players WHERE username = $1 AND is_registered = true`,
    [username.trim().toLowerCase()],
  );
  const row = result.rows[0];
  if (!row || !row.recovery_code_hash) {
    return null;
  }
  const ok = await argon2.verify(row.recovery_code_hash, normalizeRecoveryCode(recoveryCode));
  if (!ok) {
    return null;
  }
  const newPasswordHash = await argon2.hash(newPassword);
  const newCode = generateRecoveryCode();
  const newCodeHash = await argon2.hash(newCode);
  await pool.query(`UPDATE players SET password_hash = $2, recovery_code_hash = $3 WHERE id = $1`, [
    row.id,
    newPasswordHash,
    newCodeHash,
  ]);
  await recordAccountEvent('account_password_reset', row.id);
  logger.info('account_password_reset', { playerId: row.id });
  return { recoveryCode: newCode };
}

/** A registered account by id (for the session-resolved current player). */
export async function getAccountById(id: string): Promise<Account | null> {
  const result = await pool.query<AccountRow>(
    `SELECT id, nickname, username, invite_code, is_registered FROM players WHERE id = $1`,
    [id],
  );
  const row = result.rows[0];
  return row && row.is_registered ? toAccount(row) : null;
}
