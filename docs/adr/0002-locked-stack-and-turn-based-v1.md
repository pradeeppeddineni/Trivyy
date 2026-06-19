# 2. Locked stack and turn-based v1 scope

Date: 2026-06-19

## Status

Accepted

## Context

`rules.md` and the feature spec initially diverged on the stack and the
multiplayer model. The spec (`.specify/trivia-app-spec.md`) is the authoritative
product contract for v1 and was reconciled into the rules.

## Decision

- **Stack:** Node.js + Express (REST) and TypeScript on the backend; Postgres
  via `pg` + `node-pg-migrate`; React + Vite on the frontend; `express-session`
  - `argon2` for the single admin; Vitest + supertest + Playwright for tests.
- **Multiplayer:** v1 is **turn-based only** (asynchronous duels with a shared,
  locked question set). Live/synchronous WebSocket play is a deferred non-goal
  (spec section 11); the realtime rules in `rules.md` return when that phase
  begins.

## Consequences

- No WebSocket/Redis infrastructure in v1; turn-based play is plain
  request/response, with match state persisted in Postgres after each answer.
- Database access stays transparent SQL (no ORM) to keep migrations and queries
  legible for the workshop audience.
- If player accounts or live play return later, the auth and realtime decisions
  are revisited in new ADRs.
