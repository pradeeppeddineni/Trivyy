/* eslint-disable */
/**
 * Schema v7 — friendships (spec v3 §13.2). A friend relationship is one row
 * with a status; accepted friendship is treated as symmetric in queries.
 * Additive (DB-2). The friends leaderboard stays derived (API-8), so no
 * standings columns here.
 */

exports.up = (pgm) => {
  pgm.createTable('friendships', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    requester_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    addressee_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    status: { type: 'varchar(10)', notNull: true, default: 'pending' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('friendships', 'friendships_status_check', {
    check: "status IN ('pending', 'accepted')",
  });
  // One relationship per ordered pair; the service normalises direction on read.
  pgm.addConstraint('friendships', 'friendships_unique_pair', {
    unique: ['requester_id', 'addressee_id'],
  });
  pgm.addConstraint('friendships', 'friendships_no_self', {
    check: 'requester_id <> addressee_id',
  });
  pgm.createIndex('friendships', 'addressee_id'); // incoming-request lookups
};

exports.down = (pgm) => {
  pgm.dropTable('friendships');
};
