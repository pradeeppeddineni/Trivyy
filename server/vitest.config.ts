import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      // Bootstrap and infrastructure modules are exercised by integration/e2e,
      // not unit tests, so they are excluded from the unit coverage gate.
      // The services/routes layer queries Postgres and is covered by the
      // DB-backed integration suite (tests/integration, run via
      // `test:integration`); pure logic (domain/, schemas/) stays under the
      // unit gate.
      exclude: [
        'src/index.ts',
        'src/db/**',
        'src/types/**',
        'src/services/**',
        'src/routes/**',
        'src/**/*.d.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
