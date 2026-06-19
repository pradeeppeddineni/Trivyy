# AGENTS.md

This file is the entry point for coding agents (the open `AGENTS.md` convention).
It mirrors [`CLAUDE.md`](./CLAUDE.md) — see that file for full guidance — and
defers to [`rules.md`](./rules.md) for the binding rules.

## Quick reference

- **Setup:** `npm install`, then `cp .env.example .env` and `npm run hash-admin`.
- **Run:** `npm run dev --workspace server` and `npm run dev --workspace client`.
- **Verify before claiming done:** `npm run lint && npm run typecheck && npm test`.
- **Database:** schema changes only via `node-pg-migrate` files in `server/migrations`.
- **Commits:** Conventional Commits; branch from an issue; squash-merge via PR.
- **Never:** commit secrets, use `console.log` in backend code, or hard-code config.

## Capabilities wired through MCP (AGENT-6)

GitHub (branches/PRs/review), the issue tracker (Jira), and Playwright
(self-verify UI with screenshots).
