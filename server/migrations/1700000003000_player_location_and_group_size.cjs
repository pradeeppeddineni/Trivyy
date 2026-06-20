/* eslint-disable */
/**
 * Schema v4 — player location/visit analytics + a host-chosen group size.
 * (DB-2: additive, never edit a merged migration.)
 *
 * - players: ip + country (coarse location for the admin dashboard, captured
 *   from Cloudflare headers) and last_seen_at (engagement / "how often they
 *   return"). Owner-authorized analytics; never logged, never shown to players
 *   (see rules SEC-6).
 * - games: max_players so a "play together" host can cap the lobby size.
 */

exports.up = (pgm) => {
  pgm.addColumn('players', {
    ip: { type: 'text' },
    country: { type: 'varchar(2)' },
    last_seen_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('players', 'country');

  pgm.addColumn('games', {
    max_players: { type: 'integer' },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('games', 'max_players');
  pgm.dropIndex('players', 'country');
  pgm.dropColumn('players', 'last_seen_at');
  pgm.dropColumn('players', 'country');
  pgm.dropColumn('players', 'ip');
};
