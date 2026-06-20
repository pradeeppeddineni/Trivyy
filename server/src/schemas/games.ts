import { z } from 'zod';

/**
 * Request validation for the games endpoints (CODE-2, API-2). Every body is
 * parsed through one of these before it reaches the service layer.
 */

export const difficultySchema = z.enum(['any', 'easy', 'medium', 'hard']);

export const gameModeSchema = z.enum(['solo', 'duel', 'together']);
export type GameMode = z.infer<typeof gameModeSchema>;

export const createGameSchema = z.object({
  mode: gameModeSchema,
  categorySlug: z.string().trim().min(1).max(40).optional(),
  difficulty: difficultySchema.optional(),
  count: z.coerce.number().int().min(1).max(50),
  // Group ("together") only: host-chosen lobby size. Ignored for solo/duel.
  maxPlayers: z.coerce.number().int().min(2).max(10).optional(),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

/**
 * Join a duel or group game by its short code. Codes are case-insensitive on
 * the wire and normalised to uppercase before lookup (game codes are stored
 * uppercase, see domain/gameCode.ts).
 */
export const joinGameSchema = z.object({
  code: z
    .string()
    .trim()
    .length(5)
    .transform((value) => value.toUpperCase()),
});

export type JoinGameInput = z.infer<typeof joinGameSchema>;

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().min(1).max(500),
  elapsedMs: z.coerce.number().int().min(0).max(3_600_000).optional(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

/** A game id path param must be a uuid. */
export const gameIdSchema = z.string().uuid();
