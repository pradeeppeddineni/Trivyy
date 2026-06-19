# Trivyy Implementation Plan — closing the design gap

**Status:** Draft for review · **Last updated:** June 19, 2026
**Inputs:** `trivia-app-spec.md` (v2), `rules.md`, the Claude Design prototype `Trivyy.dc.html`, ADR `docs/adr/0003-three-modes-and-polling.md`.
**Goal:** take the current governed scaffold (walking-skeleton slice) to the full three-mode design, in reviewable PR-sized phases. No phase merges without green CI and tests (DOD-1, TEST-1).

This plan is **work breakdown only** — no app code is written yet.

---

## Where we are vs. where the design points

The scaffold has: the governed repo, a `createApp(env)` Express skeleton (`/api/health`, `/api/session`, `/api/me`, admin login/guard), pure `scoring.ts`, the first migration (players, questions, games, game_players, answers, events), a React placeholder, and the test/CI harness. The design needs three full modes, a curated category picker, a group lobby with QR + polling, a leaderboard, and the admin dashboard/question manager — all in a mobile-first UI translated from the prototype.

---

## Schema delta (migration v2)

A second `node-pg-migrate` migration, additive where possible:

- `games.mode` CHECK → add `'together'` (was `solo` / `duel`).
- `games` → add `host_player_id` (fk, nullable).
- `game_players` → add `status` (`joined` / `playing` / `done`); widen `role` to `creator` / `opponent` / `host` / `player`.
- New `categories` table (`id`, `slug`, `label`, `icon`, `status`, `created_at`).
- `questions` → add `category_id` (fk) alongside or replacing the free-text `category`; backfill during seeding.
- Indexes: `games.game_code` (exists), `game_players(game_id)`, `answers(game_id, player_id)` (exist); add `questions(category_id, difficulty, status)`.
- Leaderboard / head-to-head stay **derived** (API-8) — no ranking table.

---

## Phases (each = one PR)

### Phase 0 — Design tokens + component library

Translate `Trivyy.dc.html` into the React client: extract design tokens (accent `#6C5CE7`, lilac surfaces, Fredoka + Plus Jakarta Sans, radii, motion) into `client/src/styles/tokens.css`; build the shared components the screens reuse (button variants, nickname input, category tile, chip, question card, answer pill, code card, QR card, player row, leaderboard row, toast). ARC-3: components consume tokens, no hard-coded values.
**Verify:** Storybook-style preview page + a Playwright screenshot of the component gallery.

### Phase 1 — Schema v2 + seed

Write migration v2 (above) and extend `scripts/seed-questions.ts` to map OpenTDB categories onto the curated `categories` set and populate `category_id`.
**Verify:** migration up/down clean on a scratch DB; seed dry-run reports counts.

### Phase 2 — Solo end to end

Service + routes: create solo game, fetch locked questions, submit answer (graded server-side, pure `scoring.ts`), complete, results + review. Home (nickname + mode buttons), setup (category/difficulty/count), gameplay, solo results screens.
**Verify:** supertest for each endpoint; Playwright "start solo game → see first question → finish → review" (this turns the deliberately-red `solo-game.spec.ts` green).

### Phase 3 — Duel (async)

Create duel (creator plays first), issue code + link, join by link/code, play same locked set, finalize, head-to-head result with per-question breakdown. Invite/"waiting" screen **polls** `GET /api/games/:id/result` (API-7). Solo-results "challenge a friend with this set" promotes a set to a duel.
**Verify:** integration tests for create/join/score; Playwright two-context duel → result.

### Phase 4 — Play together (group)

Host creates game → lobby with game code + client-generated QR; `GET /api/games/:id/lobby` polled for roster/status; players join by code/QR, play the same set one after another; `GET /api/games/:id/leaderboard` ranks them. Together-setup, lobby, leaderboard screens; gameplay turn pill.
**Verify:** integration tests for lobby state transitions + leaderboard ordering (incl. ties); Playwright host + 2 joiners → leaderboard.

### Phase 5 — Admin

Login (decide username+password vs password-only — spec §10 open decision), dashboard (games played, most-missed questions, distributions from `answers`/`events`, OBS-3), question manager (search/filter by category/difficulty/status, add/edit modal, hide/unhide), category management. Admin login/dashboard/questions/modal screens.
**Verify:** supertest for `requireAdmin` on every admin route; Playwright admin login → hide a question → confirm it stops appearing.

### Phase 6 — Deploy

`docker-compose` parity, migrate on the Pi, Cloudflare Tunnel, runbook check, fonts decision (CDN vs self-host) for CSP/offline.
**Verify:** live URL reachable off-network; health check; one game played end to end on the Pi.

---

## Cross-cutting

- **Polling discipline (API-7):** poll endpoints stay cheap; client interval ~2–4s with backoff when idle; settle the cadence early in Phase 3.
- **Coverage stays ≥ 80%** every phase (TEST-2); scoring/lobby/leaderboard logic kept pure where possible (ARC-1).
- **Each phase is a branch → PR → green CI + 8-layer review → squash-merge** (GIT-6/7). Main is protected.
- **Field alignment:** nickname max 16; game code ~5-char uppercase; question counts 5/10/15 (spec §10).

## Open decisions to settle before the phase they block

- Admin username+password vs password-only (blocks Phase 5).
- Poll interval + backoff (blocks Phase 3).
- Game-code format/generator (blocks Phase 3).
- Self-host fonts vs CDN (blocks Phase 6 / CSP).
