/* eslint-disable */
/**
 * Schema v2 — three play modes + curated categories (spec v2, ADR 0003/0004).
 * Additive migration on top of the init schema (DB-2: append, never edit a
 * merged migration). snake_case (DB-3); leaderboard/head-to-head stay derived.
 */

exports.up = (pgm) => {
  // --- Curated categories (the six shown in the UI; "Surprise me" is no filter) ---
  pgm.createTable('categories', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    slug: { type: 'varchar(40)', notNull: true, unique: true },
    label: { type: 'text', notNull: true },
    icon: { type: 'text', notNull: true },
    status: { type: 'varchar(10)', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('categories', 'categories_status_check', {
    check: "status IN ('active', 'hidden')",
  });
  pgm.sql(`
    INSERT INTO categories (slug, label, icon) VALUES
      ('science',   'Science',   '🔬'),
      ('geography', 'Geography', '🌍'),
      ('movies',    'Movies',    '🎬'),
      ('music',     'Music',     '🎵'),
      ('history',   'History',   '📜'),
      ('tech',      'Tech',      '💻');
  `);

  // --- questions: curated category FK (nullable; raw `category` text retained) ---
  pgm.addColumn('questions', {
    category_id: { type: 'uuid', references: 'categories', onDelete: 'SET NULL' },
  });
  pgm.createIndex('questions', ['category_id', 'difficulty', 'status']);

  // --- games: add the group ("together") mode + a host ---
  pgm.dropConstraint('games', 'games_mode_check');
  pgm.addConstraint('games', 'games_mode_check', {
    check: "mode IN ('solo', 'duel', 'together')",
  });
  pgm.addColumn('games', {
    host_player_id: { type: 'uuid', references: 'players', onDelete: 'SET NULL' },
  });

  // --- game_players: per-player status + no double-join ---
  pgm.addColumn('game_players', {
    status: { type: 'varchar(10)', notNull: true, default: 'joined' },
  });
  pgm.addConstraint('game_players', 'game_players_status_check', {
    check: "status IN ('joined', 'playing', 'done')",
  });
  pgm.addConstraint('game_players', 'game_players_unique_player', {
    unique: ['game_id', 'player_id'],
  });

  // --- answers: response time (admin stats) + lookup indexes (DB-4) ---
  pgm.addColumn('answers', { elapsed_ms: { type: 'integer' } });
  pgm.createIndex('answers', 'player_id'); // exclude already-seen questions
  pgm.createIndex('answers', 'question_id'); // most-missed dashboard stat

  // --- Server-side session store (connect-pg-simple; column names fixed by the lib) ---
  pgm.createTable('session', {
    sid: { type: 'varchar', primaryKey: true },
    sess: { type: 'json', notNull: true },
    expire: { type: 'timestamp(6)', notNull: true },
  });
  pgm.createIndex('session', 'expire', { name: 'IDX_session_expire' });
};

exports.down = (pgm) => {
  pgm.dropTable('session');
  pgm.dropIndex('answers', 'question_id');
  pgm.dropIndex('answers', 'player_id');
  pgm.dropColumn('answers', 'elapsed_ms');
  pgm.dropConstraint('game_players', 'game_players_unique_player');
  pgm.dropConstraint('game_players', 'game_players_status_check');
  pgm.dropColumn('game_players', 'status');
  pgm.dropColumn('games', 'host_player_id');
  pgm.dropConstraint('games', 'games_mode_check');
  pgm.addConstraint('games', 'games_mode_check', { check: "mode IN ('solo', 'duel')" });
  pgm.dropIndex('questions', ['category_id', 'difficulty', 'status']);
  pgm.dropColumn('questions', 'category_id');
  pgm.dropTable('categories');
};
