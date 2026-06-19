import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server proxies /api to the Express backend so the SPA and API share
// an origin in development (keeps the session cookie first-party).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
  // `vite preview` (used by the E2E full-stack run) needs its own proxy block;
  // it does not reuse `server.proxy`. Keeps the SPA and API same-origin so the
  // session cookie stays first-party.
  preview: {
    port: 4173,
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
