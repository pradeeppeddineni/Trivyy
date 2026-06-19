/* eslint-disable */
/**
 * Schema v3 — one answer per (game, player, question). Enforces the idempotency
 * that submitAnswer always intended: re-submitting a question must not create a
 * second row and inflate the score (DB-2: additive, never edit a merged
 * migration). Existing duplicates are collapsed first so the constraint applies.
 */

exports.up = (pgm) => {
  // Collapse any pre-existing duplicates, keeping one physical row per triple.
  pgm.sql(`
    DELETE FROM answers a
     USING answers b
     WHERE a.ctid > b.ctid
       AND a.game_id = b.game_id
       AND a.player_id = b.player_id
       AND a.question_id = b.question_id;
  `);
  pgm.addConstraint('answers', 'answers_unique_answer', {
    unique: ['game_id', 'player_id', 'question_id'],
  });
};

exports.down = (pgm) => {
  pgm.dropConstraint('answers', 'answers_unique_answer');
};
