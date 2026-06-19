import { createApp } from '../src/app';
import type { Env } from '../src/config/env';

/** Build a valid test Env, with optional overrides for specific cases. */
export function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: 'test',
    PORT: 3000,
    DATABASE_URL: 'postgres://localhost:5432/trivyy_test',
    SESSION_SECRET: 'test-secret-test-secret',
    ADMIN_PASSWORD_HASH: '$argon2id$v=19$m=65536,t=3,p=4$unused-in-this-test$placeholder',
    CLIENT_ORIGIN: 'http://localhost:5173',
    ...overrides,
  };
}

/** Build the Express app wired with a test Env. */
export function makeApp(overrides: Partial<Env> = {}) {
  return createApp(makeEnv(overrides));
}
