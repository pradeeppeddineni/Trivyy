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
        'src/components/FriendsBar.tsx',
        'src/components/StoryViewer.tsx',
        'src/components/ShareBadgeSheet.tsx',
        'src/components/VSIntro.tsx',
        'src/components/SpinWheel.tsx',
        'src/components/RematchButton.tsx',
        'src/components/LeaderboardRow.tsx',
        'src/components/Podium.tsx',
        'src/components/ResultsScreen.tsx',
        'src/components/AnswerPill.tsx',
        'src/components/CategoryIcon.tsx',
        'src/components/Switch.tsx',
        'src/components/HomeHeroScene.tsx',
        'src/feedback/**',
        'src/theme/**',
        'src/nav.ts',
        'src/pages/Home.tsx',
        // HeroMascot wrapper is unit-tested (jsdom, static fallback only).
        // Scene.tsx and Mascot.tsx require WebGL — excluded from coverage.
        'src/three/HeroMascot.tsx',
      ],
      exclude: ['src/three/Scene.tsx', 'src/three/Mascot.tsx'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
});
