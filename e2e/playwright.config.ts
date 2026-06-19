import { defineConfig } from '@playwright/test';

/**
 * Playwright drives the critical user flows (TEST-4) and is also how the agent
 * self-verifies UI work with screenshots (AGENT-3, DOD-3). Point it at the
 * client dev server; start that separately (or wire a webServer block) when the
 * UI exists.
 */
export default defineConfig({
  testDir: './tests',
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
});
