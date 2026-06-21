import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * Client unit tests (DOD-1): component + pure-logic tests in jsdom via Vitest +
 * React Testing Library. Coverage is reported; the gate is scoped to the files
 * under test (the broad UI flows are covered by the Playwright E2E suite).
 */
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: [
        'src/lib/**',
        'src/components/Logo.tsx',
        'src/components/ThemeToggle.tsx',
        'src/components/BottomNav.tsx',
        'src/components/PageTransition.tsx',
        'src/components/ProfileView.tsx',
        'src/components/AvatarPicker.tsx',
        'src/theme/**',
        'src/nav.ts',
      ],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
