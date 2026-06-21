/* eslint-disable */
/**
 * Schema v8 — persistent groups + rematch link (spec v3 §13.3). A persistent
 * `group` is a named club with an owner and a reusable join code (distinct from
 * a single-use game code, SEC-4). Games gain a nullable `group_id` so rounds a
 * group plays aggregate into its standings (derived, API-8). Additive (DB-2).
 */

exports.up = (pgm) => {
  pgm.createTable('groups', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    name: { type: 'varchar(40)', notNull: true },
    code: { type: 'varchar(12)', notNull: true, unique: true },
    owner_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('group_members', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    group_id: { type: 'uuid', notNull: true, references: 'groups', onDelete: 'CASCADE' },
    player_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    role: { type: 'varchar(10)', notNull: true, default: 'member' },
    joined_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('group_members', 'group_members_role_check', {
    check: "role IN ('owner', 'member')",
  });
  pgm.addConstraint('group_members', 'group_members_unique', {
    unique: ['group_id', 'player_id'],
  });
  pgm.createIndex('group_members', 'player_id'); // "my groups"

  // Link a game to the persistent group it was played in (nullable; most games
  // have none). Indexed for the standings aggregation.
  pgm.addColumn('games', {
    group_id: { type: 'uuid', references: 'groups', onDelete: 'SET NULL' },
  });
  pgm.createIndex('games', 'group_id');
};

exports.down = (pgm) => {
  pgm.dropIndex('games', 'group_id');
  pgm.dropColumn('games', 'group_id');
  pgm.dropTable('group_members');
  pgm.dropTable('groups');
};
