import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import globals from 'globals';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/playwright-report/**',
      '**/test-results/**',
      'server/migrations/**',
      'design/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Backend application code: no console allowed (OBS-1, use the JSON logger).
    files: ['server/src/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'error' },
  },
  {
    files: ['client/src/**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
  },
  {
    // Tooling, tests, scripts, and config may use console and Node globals.
    files: [
      '**/*.test.ts',
      'e2e/**/*.ts',
      'scripts/**/*.{ts,mjs}',
      '**/*.config.{ts,js}',
      'eslint.config.js',
    ],
    languageOptions: { globals: { ...globals.node } },
    rules: { 'no-console': 'off' },
  },
);
