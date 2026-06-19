import { describe, it, expect } from 'vitest';
import { loadEnv } from '../src/config/env';

const validSource = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgres://localhost:5432/trivyy',
  SESSION_SECRET: 'a-sufficiently-long-secret',
  ADMIN_PASSWORD_HASH: '$argon2id$hash',
  CLIENT_ORIGIN: 'http://localhost:5173',
};

describe('loadEnv', () => {
  it('parses and coerces a valid environment', () => {
    const env = loadEnv(validSource);
    expect(env.PORT).toBe(4000);
    expect(env.NODE_ENV).toBe('test');
  });

  it('applies defaults for optional values', () => {
    const { PORT: _PORT, ...withoutPort } = validSource;
    const env = loadEnv(withoutPort);
    expect(env.PORT).toBe(3000);
  });

  it('throws a descriptive error when SESSION_SECRET is too short', () => {
    expect(() => loadEnv({ ...validSource, SESSION_SECRET: 'short' })).toThrow(/SESSION_SECRET/);
  });

  it('throws when DATABASE_URL is missing', () => {
    const { DATABASE_URL: _DATABASE_URL, ...withoutDb } = validSource;
    expect(() => loadEnv(withoutDb)).toThrow(/DATABASE_URL/);
  });
});
