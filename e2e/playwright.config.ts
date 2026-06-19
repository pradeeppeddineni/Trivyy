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
  },
  expect: {
    // Small tolerance absorbs sub-pixel anti-aliasing. Visual goldens must be
    // generated in the CI environment; the visual spec stays fixme until fonts
    // are self-hosted for deterministic rendering (see e2e/tests/gallery.spec.ts).
    toHaveScreenshot: { maxDiffPixelRatio: 0.01 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run build --workspace client && npm run preview --workspace client',
    cwd: '..',
    url: `http://localhost:${PORT}`,
    timeout: 120_000,
    reuseExistingServer: !process.env.CI,
  },
});
