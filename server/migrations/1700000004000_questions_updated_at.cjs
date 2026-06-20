/* eslint-disable */
/**
 * Schema v5 — questions.updated_at, so admin edits are timestamped (spec §7).
 * (DB-2: additive, never edit a merged migration.)
 */

exports.up = (pgm) => {
  pgm.addColumn('questions', {
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('questions', 'updated_at');
};
