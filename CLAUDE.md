# CLAUDE.md

Guidance for Claude Code (and any AI agent) working in this repo. The binding
rules live in [`rules.md`](./rules.md); the feature spec is in
[`.specify/trivia-app-spec.md`](./.specify/trivia-app-spec.md). Read both before
non-trivial work (AGENT-1).

## What this is

Trivyy: a turn-based trivia web app. Node + Express REST API, Postgres, React
SPA, hosted on a Raspberry Pi behind a Cloudflare Tunnel. Single admin; players
use nicknames, no accounts.

## Build, test, run

```bash
npm install
npm run dev --workspace server     # API  http://localhost:3000
npm run dev --workspace client     # SPA  http://localhost:5173
npm run migrate                    # apply DB migrations
npm test                           # Vitest + coverage (gate >=80%)
npm run lint && npm run typecheck  # ESLint + tsc
npm run test:e2e                   # Playwright
docker-compose up                  # full local stack
```

## Working agreement

- **Plan first.** For any non-trivial change, read the spec and present a plan
  before editing (AGENT-1, AGENT-2).
- **Tests before or with code** (TEST-1). Keep coverage >= 80% (DOD-1).
- **Verify, don't assert.** Show command output or a test result; never claim
  success without evidence (DOD-2). UI work needs a Playwright screenshot
  before it is "done" (AGENT-3, DOD-3).
- **Thin handlers, pure logic.** Business logic lives in `server/src/services`;
  scoring/game-state stays pure in `server/src/domain` (ARC-1, ARC-2).
- **Schema only via migrations** in `server/migrations` (DB-2).
- **No secrets in code or logs** (SEC-1, OBS-1). Config comes from env (CODE-3).
- **Conventional Commits**, branch from an issue, squash-merge via PR
  (GIT-1, GIT-3, GIT-6, GIT-7).

## Layout

```
server/   Express API (src/{routes,services,domain,middleware,schemas,db,config,lib})
client/   React + Vite SPA (src/{pages,components,api,styles})
e2e/      Playwright critical-flow tests
scripts/  seed-questions (OpenTDB import), hash-admin, pr-review
docs/     runbook, ADRs, course outline
```

## Current state

Walking skeleton only: `/api/health`, `/api/session`, `/api/me`, admin
login/guard, pure scoring, and the full initial DB schema. Game endpoints,
admin question CRUD, and the real UI come next. The first Playwright test
(`e2e/tests/solo-game.spec.ts`) is intentionally red.
