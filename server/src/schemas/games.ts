import { z } from 'zod';

/**
 * Request validation for the games endpoints (CODE-2, API-2). Every body is
 * parsed through one of these before it reaches the service layer.
 */

export const difficultySchema = z.enum(['any', 'easy', 'medium', 'hard']);

export const createGameSchema = z.object({
  mode: z.literal('solo'),
  categorySlug: z.string().trim().min(1).max(40).optional(),
  difficulty: difficultySchema.optional(),
  count: z.coerce.number().int().min(1).max(50),
});

export type CreateGameInput = z.infer<typeof createGameSchema>;

export const submitAnswerSchema = z.object({
  questionId: z.string().uuid(),
  selectedAnswer: z.string().min(1).max(500),
  elapsedMs: z.coerce.number().int().min(0).max(3_600_000).optional(),
});

export type SubmitAnswerInput = z.infer<typeof submitAnswerSchema>;

/** A game id path param must be a uuid. */
export const gameIdSchema = z.string().uuid();
