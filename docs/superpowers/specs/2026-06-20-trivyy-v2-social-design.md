# Trivyy v2 — Social Layer Design

**Date:** 2026-06-20 · **Status:** Approved design, phased build
**Companion docs:** `.specify/trivia-app-spec.md` (v3, source of truth) · `rules.md` (SEC-2/3/3a/4, API-8)

## Problem / intent

Trivyy v1 is a complete, account-free trivia app (solo / duel / group, admin
curation + analytics, deployed to a Pi). The owner wants a small **social
platform** on top: optional accounts, friends, persistent groups the same
players can re-summon for a **rematch**, leaderboards scoped to a group or to
your friends, and **regional** question content (India etc.). Guest play must
keep working.

## Locked decisions (from brainstorming Q&A)

| Decision              | Choice                                                                              |
| --------------------- | ----------------------------------------------------------------------------------- |
| Accounts              | **Optional**; guest play preserved                                                  |
| Auth + reset          | **Username + password**; one-time **recovery code** (no email)                      |
| Friends               | Username **search + request/accept** AND **invite link**                            |
| Standings             | **Cumulative points** (total correct), scoped (never global)                        |
| "Competition repeats" | **Rematch** — same group starts another round manually (no scheduling)              |
| Regional              | **Region filter dimension** on questions; The Trivia API importer + admin authoring |

## Architecture

Additive identity layer — the existing `players` row is the single identity;
registering **upgrades it in place** so all `game_players`/`answers` FKs and
history survive. Session prefers a registered `playerId`, falls back to guest.
All leaderboards stay **derived** (API-8). Migrations additive `.cjs` (`+1000`).

## Phased build (dependency order; each = one PR → green CI → deploy)

- **Phase 0 (done):** removed the one prod test player (`HostAda`); real
  friend/family data preserved.
- **Phase 1 (this PR):** spec v3 + rules update + this design doc. No app code.
- **Phase A — Accounts:** migration v6 (`players`: `username`, `password_hash`,
  `recovery_code_hash`, `is_registered`, `invite_code`); `accountService` +
  `routes/auth.ts` (register/login/logout/reset/me), argon2, rate-limit,
  guest-upgrade-in-place; `resolveCurrentPlayer` prefers `session.playerId`;
  client auth screens + account menu.
- **Phase B — Friends:** migration v7 `friendships`; `friendService` +
  `routes/friends.ts` (search/request/accept/decline/list, `?friend=CODE`);
  friends leaderboard (derived). Client friends page + board.
- **Phase C — Groups + rematch:** migration v8 `groups` + `group_members` +
  `games.group_id`; `groupClubService` (create/invite/join/launch/rematch);
  group standings (derived). Client groups list + detail + rematch.
- **Phase D — Regional questions (independent):** migration v9 `questions.region`
  - index; `pickQuestions`/create-schema/setup region filter; admin region field;
    `scripts/seed-trivia-api.ts` importer. Seed an India set.

## Key reuse

argon2 + `express-rate-limit` (admin auth pattern), `generateGameCode` (group/
invite codes), `pickQuestions` (region filter), `together` game plumbing +
`RoundPlayer`/lobby/leaderboard components (group games + rematch),
`InviteActions`/`QRCard` (friend/group invites), derived-leaderboard SQL
(group/friends standings).

## Verification

Per phase: typecheck/lint/format, unit ≥80%, integration (CI Postgres), E2E with
screenshots; then live smoke on `trivyy.com`. See the spec §13 and the plan file
for the per-phase acceptance checks.

## Non-goals (unchanged)

Real-time/WebSocket sync, email/social login, AI questions, scheduled
competitions, global/all-time leaderboards, native apps.
