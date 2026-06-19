import { z } from 'zod';

/**
 * Nicknames are untrusted input (SEC-5): length-limited and trimmed. No other
 * personal data is collected.
 */
export const nicknameSchema = z.object({
  nickname: z.string().trim().min(1, 'nickname is required').max(20, 'nickname is too long'),
});

export type NicknameInput = z.infer<typeof nicknameSchema>;
