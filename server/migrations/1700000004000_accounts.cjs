/* eslint-disable */
/**
 * Schema v6 — optional player accounts (spec v3 §13.1, SEC-3/3a).
 * Additive (DB-2): a guest player is an existing row; registering UPGRADES that
 * row in place (sets username/password/recovery/invite_code), so all
 * game_players + answers history is preserved. Guests keep username = NULL.
 */

exports.up = (pgm) => {
  pgm.addColumn('players', {
    // Login handle, stored lowercased; NULL for guests. Unique among accounts.
    username: { type: 'varchar(20)' },
    // argon2 hashes — never plaintext, never logged (SEC-1/3a).
    password_hash: { type: 'text' },
    recovery_code_hash: { type: 'text' },
    is_registered: { type: 'boolean', notNull: true, default: false },
    // Reusable personal code for friend invite links (Phase B). Unique.
    invite_code: { type: 'varchar(12)' },
  });
  pgm.addConstraint('players', 'players_username_unique', { unique: ['username'] });
  pgm.addConstraint('players', 'players_invite_code_unique', { unique: ['invite_code'] });
};

exports.down = (pgm) => {
  pgm.dropConstraint('players', 'players_invite_code_unique');
  pgm.dropConstraint('players', 'players_username_unique');
  pgm.dropColumn('players', [
    'username',
    'password_hash',
    'recovery_code_hash',
    'is_registered',
    'invite_code',
  ]);
};
