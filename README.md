# Trivyy

A turn-based trivia game for a small friend group. Players pick a nickname and
play solo or invite a friend to an asynchronous duel with a shareable game code.
A single admin curates the question bank. Self-hosted on a Raspberry Pi behind a
Cloudflare Tunnel.

This repository is a workshop project. The authoritative documents are:

- [`rules.md`](./rules.md) — the engineering constitution (testable SHALL rules).
- [`.specify/trivia-app-spec.md`](./.specify/trivia-app-spec.md) — the feature spec.
- [`docs/course-outline.md`](./docs/course-outline.md) — the workshop outline.

## Stack

| Layer    | Choice                                            |
| -------- | ------------------------------------------------- |
| Backend  | Node.js + Express (REST), TypeScript              |
| Database | Postgres (`pg` + `node-pg-migrate` migrations)    |
| Frontend | React + Vite, TypeScript                          |
| Auth     | `express-session` + `argon2` (single admin)       |
| Tests    | Vitest + supertest (unit/integration), Playwright |
| Hosting  | Raspberry Pi + Cloudflare Tunnel                  |

## Prerequisites

- Node.js >= 20 (developed on 24)
- Docker + Docker Compose (for Postgres and local run)

## Local setup

```bash
git clone https://github.com/pradeeppeddineni/Trivyy.git
cd Trivyy
npm install
cp .env.example .env        # then fill in the values
npm run hash-admin -- 'choose-an-admin-password'   # paste into ADMIN_PASSWORD_HASH
```

### Run with Docker (recommended)

```bash
docker-compose up           # Postgres + API + client
```

### Run the pieces directly

```bash
npm run migrate             # apply database migrations
npm run dev --workspace server   # API on http://localhost:3000
npm run dev --workspace client   # SPA on http://localhost:5173
```

## Environment variables

Every variable is documented in [`.env.example`](./.env.example). Key ones:
`DATABASE_URL`, `SESSION_SECRET`, `ADMIN_PASSWORD_HASH`, `CLIENT_ORIGIN`.
`ANTHROPIC_API_KEY` is **CI-only** (the PR-review workflow), never used by the app.

## Common commands

```bash
npm run lint            # ESLint
npm run format:check    # Prettier
npm run typecheck       # tsc across server + client
npm test                # Vitest unit + integration, with coverage gate (>=80%)
npm run test:e2e        # Playwright (the first solo-game test is intentionally red)
npm run seed            # import questions from OpenTDB (skeleton)
```

## Running on the Raspberry Pi

See [`docs/runbook.md`](./docs/runbook.md) for deploy, restart, logs, and rollback.

## Attribution

Question content is sourced from the [Open Trivia Database](https://opentdb.com/)
under CC BY-SA 4.0.

## License

Source code under the [MIT License](./LICENSE).
