/* eslint-disable */
/**
 * Schema v11 — stories (spec Phase 2 UI overhaul). Adds a `stories` table for
 * 24-hour trivia-badge shares visible to friends. Online-presence reuses the
 * existing `players.last_seen_at` column (added in 1700000003000), so this
 * migration does not touch `players`. Purely additive (DB-2).
 */

exports.up = (pgm) => {
  pgm.createTable('stories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    player_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    /** Only 'badge' for now; reserved for future kinds. */
    kind: { type: 'varchar(16)', notNull: true },
    /** Short display label, e.g. "Geography Master". */
    label: { type: 'text', notNull: true },
    /** Optional supplementary text (score, category, etc.). */
    detail: { type: 'text' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    /** When the story should no longer appear in feeds (24 h after creation). */
    expires_at: { type: 'timestamptz', notNull: true },
  });

  // Efficient lookup of "my active stories" and the friend-feed join.
  pgm.createIndex('stories', 'player_id');
  // Efficient sweep for expired-story filtering.
  pgm.createIndex('stories', 'expires_at');
};

exports.down = (pgm) => {
  pgm.dropTable('stories');
};
