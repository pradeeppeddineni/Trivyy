import { defineConfig } from 'vitest/config';

/**
 * DB-backed integration tests (API-4). These run only where a real Postgres is
 * available (CI, after `npm run migrate`) and require DATABASE_URL. They are
 * kept out of the default unit run so `npm test` needs no database.
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.itest.ts'],
    // No coverage gate here; the unit run owns the 80% threshold.
    hookTimeout: 30_000,
    testTimeout: 30_000,
    // Every file shares the one Postgres and resets it in beforeEach
    // (TRUNCATE), so the files MUST run one at a time — otherwise one file's
    // reset wipes another's in-flight data. Serialize file execution.
    fileParallelism: false,
  },
});
