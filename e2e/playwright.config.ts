import { defineConfig, devices } from '@playwright/test';

// Port the built client is previewed on (4173 = Vite preview, distinct from the
// 5173 dev server). The webServer block builds + serves it for the tests.
const PORT = 4173;

/**
 * Playwright drives the critical user flows (TEST-4) and is how the agent
 * self-verifies UI with screenshots (AGENT-3, DOD-3). Runs in CI via the
 * `E2E (Playwright)` job in .github/workflows/ci.yml.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    // Render the static (non-WebGL) mascot in E2E: avoids GPU/WebGL context
    // churn from the 3D canvas mounting across many navigations in CI, and keeps
    // the critical-flow tests deterministic. Real users are unaffected.
    reducedMotion: 'reduce',
  },
  expect: {
    // Small tolerance absorbs sub-pixel anti-aliasing. Visual goldens must be
    // generated in the CI environment; the visual spec stays fixme until fonts
    // are self-hosted for deterministic rendering (see e2e/tests/gallery.spec.ts).
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Full stack for the critical-flow E2E (Phase 2): the Express API on :3000 and
  // the built client preview on :4173. The client preview proxies /api to the
  // API (see e2e/preview-proxy via vite preview server proxy in vite.config.ts).
  // The API needs a database; CI provides DATABASE_URL + a seeded fixture before
  // running this suite.
  webServer: [
    {
      command: 'npm run start --workspace server',
      cwd: '..',
      url: 'http://localhost:3000/api/health',
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
      env: {
        NODE_ENV: 'test',
        PORT: '3000',
        DATABASE_URL: process.env.DATABASE_URL ?? 'postgres://trivyy:trivyy@localhost:5432/trivyy',
        SESSION_SECRET: process.env.SESSION_SECRET ?? 'e2e-session-secret-e2e',
        // Real argon2id hash of the E2E admin password ('e2e-admin-password').
        // The admin-login spec types that password to drive the full flow.
        ADMIN_PASSWORD_HASH:
          process.env.ADMIN_PASSWORD_HASH ??
          '$argon2id$v=19$m=65536,t=3,p=4$vqrdWtW1e5CnGoiu+PYzzQ$hsd8ePrkwwBrDGTJpZDIX4KAuB3YTNUGXKuhuwiNe5w',
        CLIENT_ORIGIN: `http://localhost:${PORT}`,
      },
    },
    {
      command: 'npm run build --workspace client && npm run preview --workspace client',
      cwd: '..',
      url: `http://localhost:${PORT}`,
      timeout: 120_000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
