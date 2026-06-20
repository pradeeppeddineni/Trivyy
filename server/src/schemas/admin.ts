import { z } from 'zod';

/** Request validation for the admin curation endpoints (CODE-2, API-2). */

export const adminLoginSchema = z.object({
  username: z.string().trim().min(1).max(60),
  password: z.string().min(1, 'password is required'),
});

export const adminQuestionSchema = z.object({
  text: z.string().trim().min(1).max(500),
  correctAnswer: z.string().trim().min(1).max(300),
  incorrectAnswers: z.array(z.string().trim().min(1).max(300)).min(1).max(5),
  categorySlug: z.string().trim().min(1).max(40).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
});

export type AdminQuestionInput = z.infer<typeof adminQuestionSchema>;

export const questionStatusSchema = z.object({
  status: z.enum(['active', 'hidden']),
});

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(40)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, or hyphens'),
  label: z.string().trim().min(1).max(60),
  icon: z.string().trim().min(1).max(8),
});

/** Query params for the questions list (all optional). */
export const listQuestionsQuerySchema = z.object({
  search: z.string().trim().max(200).optional(),
  category: z.string().trim().max(40).optional(),
  difficulty: z.enum(['any', 'easy', 'medium', 'hard']).optional(),
  status: z.enum(['active', 'hidden', 'all']).optional(),
  page: z.coerce.number().int().min(1).max(1000).optional(),
});
