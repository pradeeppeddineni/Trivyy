import { z } from 'zod';

/** Validation for the account endpoints (CODE-2, API-2, spec v3 §13.1). */

const username = z
  .string()
  .trim()
  .min(3, 'username must be at least 3 characters')
  .max(20)
  .regex(/^[a-zA-Z0-9_]+$/, 'username may use letters, numbers, and underscore only');

const password = z.string().min(8, 'password must be at least 8 characters').max(200);

const nickname = z.string().trim().min(1).max(20);

export const registerSchema = z.object({
  username,
  password,
  // Optional display name; defaults to the session nickname or the username.
  nickname: nickname.optional(),
});

export const loginSchema = z.object({
  username,
  password: z.string().min(1).max(200),
});

export const resetSchema = z.object({
  username,
  recoveryCode: z.string().trim().min(8).max(40),
  newPassword: password,
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ResetInput = z.infer<typeof resetSchema>;
