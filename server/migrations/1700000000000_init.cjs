/* eslint-disable */
/**
 * Initial schema (DB-2: schema only changes through versioned migrations).
 * Mirrors the data model in trivia-app-spec.md section 7. snake_case (DB-3),
 * indexed lookups (DB-4), soft-delete via question status (DB-6), source kept
 * for attribution (DB-7), and an events audit table (DB-5).
 */

exports.up = (pgm) => {
  pgm.createExtension('pgcrypto', { ifNotExists: true });

  pgm.createTable('players', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    nickname: { type: 'varchar(20)', notNull: true },
    session_token: { type: 'text', notNull: true, unique: true },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });

  pgm.createTable('questions', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    text: { type: 'text', notNull: true },
    correct_answer: { type: 'text', notNull: true },
    incorrect_answers: { type: 'text[]', notNull: true },
    category: { type: 'text', notNull: true },
    difficulty: { type: 'varchar(10)', notNull: true },
    source: { type: 'text', notNull: true, default: 'opentdb' },
    status: { type: 'varchar(10)', notNull: true, default: 'active' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
    updated_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('questions', 'questions_difficulty_check', {
    check: "difficulty IN ('easy', 'medium', 'hard')",
  });
  pgm.addConstraint('questions', 'questions_status_check', {
    check: "status IN ('active', 'hidden')",
  });
  pgm.createIndex('questions', ['category', 'difficulty', 'status']);

  pgm.createTable('games', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    mode: { type: 'varchar(10)', notNull: true },
    game_code: { type: 'varchar(12)', unique: true },
    category: { type: 'text' },
    difficulty: { type: 'varchar(10)' },
    num_questions: { type: 'integer', notNull: true },
    question_ids: { type: 'uuid[]', notNull: true },
    status: { type: 'varchar(12)', notNull: true, default: 'open' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.addConstraint('games', 'games_mode_check', {
    check: "mode IN ('solo', 'duel')",
  });
  pgm.createIndex('games', 'game_code');

  pgm.createTable('game_players', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    game_id: { type: 'uuid', notNull: true, references: 'games', onDelete: 'CASCADE' },
    player_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    role: { type: 'varchar(10)', notNull: true },
    score: { type: 'integer', notNull: true, default: 0 },
    completed_at: { type: 'timestamptz' },
  });
  pgm.createIndex('game_players', 'game_id');
  pgm.createIndex('game_players', 'player_id');

  pgm.createTable('answers', {
    id: { type: 'uuid', primaryKey: true, default: pgm.func('gen_random_uuid()') },
    game_id: { type: 'uuid', notNull: true, references: 'games', onDelete: 'CASCADE' },
    player_id: { type: 'uuid', notNull: true, references: 'players', onDelete: 'CASCADE' },
    question_id: { type: 'uuid', notNull: true, references: 'questions' },
    selected_answer: { type: 'text' },
    is_correct: { type: 'boolean', notNull: true },
    answered_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('answers', ['game_id', 'player_id']);

  // Immutable audit trail the admin dashboard reads (DB-5, OBS-3).
  pgm.createTable('events', {
    id: { type: 'bigserial', primaryKey: true },
    game_id: { type: 'uuid' },
    type: { type: 'text', notNull: true },
    payload: { type: 'jsonb', notNull: true, default: '{}' },
    created_at: { type: 'timestamptz', notNull: true, default: pgm.func('now()') },
  });
  pgm.createIndex('events', 'game_id');
};

exports.down = (pgm) => {
  pgm.dropTable('events');
  pgm.dropTable('answers');
  pgm.dropTable('game_players');
  pgm.dropTable('games');
  pgm.dropTable('questions');
  pgm.dropTable('players');
};
