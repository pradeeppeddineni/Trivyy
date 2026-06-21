# Trivia App — Specification (v4)

**Status:** Draft for workshop
**Last updated:** June 21, 2026
**Scope:** Self-hosted trivia web app for friends, hosted on a Raspberry Pi. Three ways to play (solo, async duel, group "play together"), now with an optional **social layer**: user accounts, friends, persistent groups that can rematch, leaderboards scoped to a group or your friends, and regional question content.

> **v4 change (look and feel):** adds §10 "Look and feel" covering the Phase 0 UI overhaul: electric-blue rebrand, light/dark theme system (ARC-3a), persistent bottom nav, installable PWA (UI-1), and Framer Motion transitions. Sections 10-13 renumbered to 11-14 to accommodate the new section. See `docs/superpowers/specs/2026-06-21-trivyy-ui-overhaul-design.md` and the Phase 0 implementation plan.
>
> **v3 change (social layer):** adds **optional user accounts** (username + password, recovery-code reset, no email), **friends** (search + invite link), **persistent groups** the same players can re-summon for a **rematch**, **scoped leaderboards** (group standings + friends leaderboard, cumulative points), and **regional questions** (a country/region filter dimension, sourced from The Trivia API + admin authoring). Guest play (nickname only) is preserved. This reverses v1's "no accounts" stance for players who opt in; see §3 and §14. Real-time/WebSocket play, email/social login, global leaderboards, AI questions, and scheduled competitions remain non-goals.
>
> **v2 change:** reconciled with the Claude Design prototype (`Trivyy.dc.html`). Added the **play-together group mode** (lobby + leaderboard, invite by code or QR). Group/lobby live updates use **short-interval polling over REST**, not WebSockets. See ADR `docs/adr/0003-three-modes-and-polling.md`.

---

## 1. Overview

A web-based trivia game inspired by TriviaDuel and Trivia Crack, built as a group workshop project. Players answer multiple-choice questions in one of three modes:

- **Solo** — play a set of questions alone for a score.
- **Challenge a friend (duel)** — an asynchronous 1-v-1 on the same locked question set, shared by code or link.
- **Play together (group)** — a host creates a game, friends join by code or QR on their own phones, everyone answers the same locked set (one after another, not simultaneously), and a leaderboard ranks them.

The app is hosted at home on a Raspberry Pi, backed by a Postgres database, and exposed to the public internet through a Cloudflare Tunnel on a custom domain. Questions are seeded once from a free public trivia source into our own database, then curated and extended by an admin. Players need no account — they pick a nickname. Only the admin logs in.

---

## 2. Goals and non-goals

### Goals (v1)

- Players can play a **solo** game (answer a set of questions, get a score and a review).
- Players can **challenge a friend** to an **asynchronous duel** using a shareable game code or link, then see a head-to-head, per-question breakdown.
- Players can host a **play-together group game**: invite by **code or QR**, friends join on their own phones, all answer the **same locked set**, and a **leaderboard** ranks everyone.
- Players **self-identify with a nickname**; registration is **optional** (guests can always play).
- Players **may optionally register an account** (username + password, recovery-code reset) to unlock friends, persistent groups, scoped leaderboards, and cross-device history (§14).
- Players can **add friends** (username search or invite link) and see a **friends leaderboard**.
- Players can **create persistent groups**, invite others, **rematch** with the same group, and see **group standings**.
- Questions can carry a **region** (e.g. India) so players can filter by country/region as well as category.
- An **admin** can log in to view statistics, add/edit questions, hide bad questions, and manage categories.
- Questions are **pre-seeded** from the Open Trivia Database (and The Trivia API for regional content) and curated locally.
- The app is reachable on a custom domain via Cloudflare Tunnel, with no open router ports.

### Non-goals (deferred)

- **Real-time synchronous play** — everyone on the same question at the same instant with a shared countdown. The group lobby updates via polling, not a live socket. _Deferred._
- **Email or social login.** Accounts are username + password with a recovery-code reset; no email is sent. _(v3: account passwords are now in scope; email is not.)_
- **Scheduled / automated recurring competitions.** "Repeat" means the same group manually starting another round (a rematch), not a cron-driven schedule.
- AI-generated questions.
- Mobile native apps (the UI is a mobile-first web app).
- Horizontal scaling / Redis / multiple server processes / WebSockets.
- **Global / all-time public leaderboards** across all players. Per-game, per-group, and friends-scoped leaderboards are in scope; global ones are not.

---

## 3. Users and roles

| Role                  | Auth                              | Capabilities                                                                                                                                                 |
| --------------------- | --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Guest player**      | None (nickname + browser session) | Start a solo game; create or join a duel; host or join a group game; answer questions; view own results, the duel head-to-head, and the per-game leaderboard |
| **Registered player** | Username + password               | Everything a guest can, plus: friends, persistent groups, scoped (group/friends) leaderboards, and cross-device history tied to their account                |
| **Admin**             | Username + password (single)      | Everything a player can do, plus: view statistics, add/edit questions, hide/unhide questions, manage categories                                              |

There are **three auth roles** (guest player, registered player, single admin). The host/creator vs. opponent/player distinction inside a game, and group ownership, are per-game / per-group data, not an auth boundary. A guest is a nickname plus a browser-session cookie; a registered player additionally has a unique username + an argon2 password hash and can sign in on any device. **Registration is optional and upgrades the player's existing row in place**, preserving their nickname and history. Recovery uses a one-time code (see §14), not email.

---

## 4. Gameplay

### 4.1 Solo mode

1. Player enters a nickname (if not already in session).
2. Player picks a **category** (from a curated set, or "any"), a **difficulty** (any / easy / medium / hard), and a **question count** (e.g. 5 / 10 / 15).
3. The app serves the chosen number of questions, excluding ones the player has already seen where possible.
4. Each question is multiple choice: one correct answer, three incorrect, shown in randomized order.
5. Player answers; the app grades each answer immediately and records correctness.
6. At the end, the player sees their score and a per-question review. They can play again or **promote the set to a duel** ("challenge a friend with this set").

### 4.2 Challenge a friend — asynchronous duel

The TriviaDuel-style model, simplified. The two players do **not** need to be online at the same time.

1. Player A sets up a round (category, difficulty, count) and **plays their round first** on a freshly locked question set.
2. After playing, Player A gets a **game code** and a **shareable link** and lands on an invite/"waiting for your friend" screen.
3. Player A shares the code/link with Player B.
4. Player B opens the link (or joins by code), enters a nickname, and plays **the same locked set**.
5. Once both rounds are complete, the match is scored and a head-to-head result is shown: both scores, a winner badge, and a **per-question breakdown** of each player's answer vs. the correct one.

The creator's invite screen reflects completion by **polling** the game result; there is no live socket.

### 4.3 Play together — group game

A host-led group game for a small friend group. Players are networked (each on their own phone) but **play one after another**, not simultaneously.

1. The host sets up the game (category, difficulty, count) and taps **Create game & invite**.
2. The app creates the game with a locked question set and shows a **lobby**: a large **game code** plus a **QR code** for the join link.
3. Friends join by scanning the QR or entering the code, then pick a nickname; they appear in the lobby **players list** (the lobby **polls** for new joins and completions).
4. Each player plays the same locked set when it's their turn; the lobby shows per-player status (not started / playing / done with score).
5. When everyone has played, anyone opens the **leaderboard**, which ranks all players by score.

### 4.4 Scoring and results

- Correct answer: **+1**. Incorrect or unanswered: **0**. (Difficulty weighting is a later option.)
- **Duel:** higher score wins; equal scores are a draw.
- **Group:** players are ranked by score on the leaderboard; ties share a rank.
- Scoring is intentionally simple for v1 and can be tuned after playtesting.

---

## 5. Questions, categories, and data sourcing

### 5.1 Decision: pre-seeded + admin-curated (not live API reads)

Questions are imported **once** from the Open Trivia Database (OpenTDB) into our own Postgres table. OpenTDB is the **import source**; Postgres is the **system of record**; the admin UI is the **ongoing curation layer**. Rationale: reliability (no game-time external dependency), local control of what each player has seen, admin editing only works on local data, and we still get OpenTDB's content.

### 5.2 Source

- **Primary:** Open Trivia Database (`https://opentdb.com/api.php`). Free, no API key. Licensed CC BY-SA 4.0 (attribution required).
- **Optional secondary (later):** The Trivia API (`the-trivia-api.com`).

### 5.3 Import (seed) process

A re-runnable script that loops OpenTDB requests (using a session token to avoid duplicates) until a target count is reached, **decodes HTML entities**, normalizes each question into our schema (text, correct answer, incorrect answers, category, difficulty, source), deduplicates on question text, and inserts into `questions`.

### 5.4 Categories

The UI presents a **curated set of categories**, each with a display label and an icon (the design shows six tiles plus "any"), rather than the raw OpenTDB category list. Categories are stored in their own table so the admin can manage them, and each question maps to one. Imported OpenTDB categories are mapped onto this curated set during seeding.

### 5.5 Admin curation

Through the web UI the admin can: add a question (text, 1 correct + 3 incorrect, category, difficulty, **region**); edit any question; **hide/unhide** a question via a status flag (soft delete — never hard-delete, to preserve game-history references); and manage the category list. The questions screen supports search and filtering by category, difficulty, status, and region.

### 5.6 Regional content (v3)

Each question MAY carry a **region** (ISO-3166 alpha-2, e.g. `IN` for India; NULL = global). Region is a **filter dimension orthogonal to category**: a player can pick a region (or "anywhere") in setup alongside a category, and `pickQuestions` filters accordingly. Regional questions are sourced two ways: a new importer pulls from **The Trivia API** (`the-trivia-api.com`, which supports a region/language selector) tagging `source='trivia-api'` and the chosen `region`; and the **admin** can author region-tagged questions through the existing CRUD. OpenTDB content stays `region = NULL` (global).

---

## 6. Architecture and tech stack

```
[ Player / Admin browser (mobile-first web app) ]
            |
        HTTPS (custom domain)
            |
   [ Cloudflare Edge ]
            |
   Cloudflare Tunnel (cloudflared, outbound-only)
            |
   [ Raspberry Pi ]
     |            |
  Web app      Postgres
 (Node/Express  (questions, categories, players,
  + React)       games, game_players, answers, events)
```

### Components

- **Frontend:** React + Vite, TypeScript. **Mobile-first** single-column UI (the design targets a ~440px phone frame). It is a multi-screen flow (home, setup, gameplay, results, invite, join, lobby, leaderboard, admin).
- **Backend:** Node.js + Express, TypeScript. Plain **REST** API. The group lobby and the duel "waiting" screen use **short-interval client polling** (a lightweight GET), not WebSockets.
- **Database:** Postgres on the Pi.
- **Admin auth:** `express-session` + `argon2` for a single admin (do not roll your own crypto).
- **Exposure:** `cloudflared` named tunnel to `localhost`; no router ports opened.
- **Process management:** app + `cloudflared` under systemd or Docker so they survive reboots.

### Why polling, not WebSockets, in v1

Group play is "one after another," so the only thing that must update across devices is the **lobby roster and per-player status** plus the duel result. A cheap polled GET every few seconds covers that without a persistent connection, Redis, or a second process. WebSockets remain deferred to a future synchronous-play phase.

### Design system

The visual language comes from the Claude Design prototype (`Trivyy.dc.html`): accent `#6C5CE7` on light lilac backgrounds, **Fredoka** (display) + **Plus Jakarta Sans** (body), rounded cards, playful motion. Tokens and components are translated into the React client; raw style values are not hard-coded. Fonts currently load from Google Fonts (note for the Pi/Cloudflare deploy and any CSP; self-hosting fonts is an option later).

---

## 7. Data model (initial sketch)

> Indicative, not final. Refine during the schema build via versioned migrations.

**players** — `id` (pk), `nickname`, `session_token`, `created_at`, `ip`, `country`, `last_seen_at` (analytics, admin-only). **v3 account columns:** `username` (unique, nullable; null = guest), `password_hash` (argon2, nullable), `recovery_code_hash` (argon2 of the one-time code, nullable), `is_registered` (bool), `invite_code` (unique, for friend invite links). A registered player is the same row upgraded in place, so all `game_players`/`answers` history is retained.

**friendships** (v3) — `id` (pk), `requester_id` (fk players), `addressee_id` (fk players), `status` (pending / accepted), `created_at`; unique on the player pair. Accepted friendship is symmetric (queried both directions).

**groups** (v3, persistent — distinct from a `together` game) — `id` (pk), `name`, `code` (unique invite/join code), `owner_id` (fk players), `created_at`.

**group_members** (v3) — `id` (pk), `group_id` (fk), `player_id` (fk), `role` (owner / member), `joined_at`; unique on (group_id, player_id).

**categories** — `id` (pk), `slug`, `label`, `icon`, `status` (active / hidden), `created_at`

**questions** — `id` (pk), `text`, `correct_answer`, `incorrect_answers` (array), `category_id` (fk), `difficulty` (easy / medium / hard), `source` (opentdb / trivia-api / admin), `status` (active / hidden), `created_at`, `updated_at`, **`region`** (v3; ISO-3166 alpha-2, nullable; NULL = global)

**games** — `id` (pk), `mode` (**solo / duel / together**), `game_code` (for duel + group invites), `category_id`, `difficulty` (nullable; NULL = any), `num_questions`, `question_ids` (the locked set), `status` (open / in_progress / complete), `host_player_id`, `max_players`, `created_at`, **`group_id`** (v3; nullable fk groups — the persistent group this game belongs to, for standings + rematch)

**game_players** — `id` (pk), `game_id` (fk), `player_id` (fk), `role` (**creator / opponent / host / player**), `score`, `status` (joined / playing / done), `completed_at`. A game has 2 rows for a duel and N rows for a group game.

**answers** — `id` (pk), `game_id` (fk), `player_id` (fk), `question_id` (fk), `selected_answer`, `is_correct`, `elapsed_ms` (nullable, client-measured response time), `answered_at`

**events** — `id` (pk), `game_id`, `type`, `payload` (jsonb), `created_at` — audit trail the admin dashboard reads.

**session** — server-side session store (managed by `connect-pg-simple`); holds the signed session payload (player nickname, admin elevation). Created via migration for DB-2 compliance. See ADR `docs/adr/0004-admin-auth-and-session-store.md`.

The **leaderboard** for a group game is derived: `game_players` for that game, ordered by `score` desc. The duel head-to-head is derived from the two `game_players` rows plus their `answers`.

---

## 8. API surface (initial sketch)

> Indicative REST endpoints. Admin routes are auth-gated. Lobby/result reads are pollable.

**Session (guest)**

- `POST /api/session` — set/update nickname, issue session (guest play).
- `GET /api/me` — current player info (guest or registered).

**Accounts (v3)**

- `POST /api/auth/register` — username + nickname + password; upgrades the current player row in place; returns the one-time recovery code **once**.
- `POST /api/auth/login` — username + password (rate-limited).
- `POST /api/auth/logout`.
- `POST /api/auth/reset` — username + recovery code + new password (rate-limited).
- `GET /api/auth/me` — registered-account info (username, nickname, invite code).

**Friends (v3, auth required)**

- `GET /api/friends` — accepted friends; `GET /api/friends/requests` — pending.
- `GET /api/friends/search?q=` — find players by username.
- `POST /api/friends/requests` — send a request (by username); `POST /api/friends/requests/:id/accept` | `/decline`.
- `POST /api/friends/invite/:code` — accept a friend invite link (`?friend=CODE`).
- `GET /api/friends/leaderboard` — cumulative-points leaderboard over me + friends (derived, API-8).

**Groups (v3, persistent; auth required)**

- `POST /api/groups` — create; `GET /api/groups` — my groups; `GET /api/groups/:id` — detail + members.
- `POST /api/groups/join` — join by code; `POST /api/groups/:id/invite` — invite a friend.
- `POST /api/groups/:id/games` — launch a `together` game for this group; **rematch** = the same call again.
- `GET /api/groups/:id/leaderboard` — cumulative standings across the group's games (derived, API-8).

**Games (solo / duel / together)**

- `POST /api/games` — create a game (`mode`, settings); returns the game + `game_code` for duel/together.
- `GET /api/games/:code` — look up a game by code (to join).
- `POST /api/games/:id/join` — join a duel or group game with a nickname.
- `GET /api/games/:id/questions` — the locked question set.
- `POST /api/games/:id/answers` — submit an answer (graded server-side).
- `POST /api/games/:id/complete` — finalize a player's round.
- `GET /api/games/:id/result` — duel head-to-head once both rounds finish (**polled** by the invite screen).
- `GET /api/games/:id/lobby` — group lobby state: players + per-player status (**polled** by the lobby).
- `GET /api/games/:id/leaderboard` — ranked group results.

**Admin (auth required)**

- `POST /api/admin/login`, `POST /api/admin/logout`
- `GET /api/admin/stats` — usage statistics (games played, most-missed questions, distributions).
- `GET /api/admin/questions` — list/filter (search, category, difficulty, status).
- `POST /api/admin/questions`, `PUT /api/admin/questions/:id`, `PATCH /api/admin/questions/:id/status` (hide/unhide).
- `GET/POST /api/admin/categories` — manage categories.

QR codes are generated on the client from the join link (no server endpoint needed).

---

## 9. Hosting and deployment notes

- **Domain + Tunnel:** Cloudflare named tunnel routes the custom domain to the local app port; no open ports; TLS at Cloudflare's edge.
- **Polling note:** lobby/result polling is plain HTTPS GET through the tunnel — no special config.
- **WebSocket note (future):** if synchronous play is added later, WebSockets proxy through the tunnel; if the route sits behind a Cloudflare Access policy, set it to bypass to avoid spurious 302/502 on the socket.
- **Fonts:** _Resolved_ — self-host (bundle Fredoka + Plus Jakarta Sans) so the CSP needs no external origins; Phase 0 uses the Google CDN as an interim, switched to self-hosted in Phase 6.

---

## 10. Look & feel

The UI overhaul (Phase 0 and beyond) establishes a consistent visual language on top of the existing token system.

- **Brand accent:** electric blue (`#1f6bff`), replacing the original violet. All components consume `var(--accent)` (ARC-3), so the accent change re-skins the whole app from one file.
- **Themes:** light and dark, driven by a `[data-theme]` attribute on `<html>` and a `[data-theme="dark"]` token cascade in `tokens.css`. The active theme is persisted to `localStorage` and defaults to `prefers-color-scheme`. No component may hard-code a color value (ARC-3, ARC-3a).
- **Navigation:** a persistent `BottomNav` (Home, Friends, Play, Boards, You) renders on primary tab screens and is hidden during active gameplay. Navigation remains query-param based; no router library swap.
- **Installable PWA:** the client ships a web manifest (`display: standalone`) and a Workbox service worker that caches the built app shell only; `/api` is always network (UI-1, API-6).
- **Motion:** Framer Motion provides fade-up page transitions and element animations, respecting `prefers-reduced-motion`. Lottie and 3D animations are deferred to later phases.
- **Typography:** Fredoka (display), Plus Jakarta Sans (body), self-hosted via `@fontsource` so no external CDN is required.

---

## 11. Open decisions

- **Admin identity:** _Resolved_ — **username + password** (matches the design): `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` from env, single admin, Postgres-backed sessions (`connect-pg-simple`). See ADR `docs/adr/0004-admin-auth-and-session-store.md`.
- **Poll interval:** _Resolved_ — ~3s while active, back off to ~10s when idle, pause on a hidden tab, stop when the game completes; cheap version/`304` responses (API-7).
- **Score weighting / tiebreaks:** flat +1 vs. difficulty weighting; draws vs. answer-time tiebreak.
- **Game code format:** _Resolved_ — 5-char uppercase, alphabet excluding `0/O/1/I/L`, collision-checked, single-use (SEC-4).
- **Seed size and category mix.**
- **Time limits per question:** none in v1, or a soft countdown for flavor?

---

## 12. Future phases (post-v1)

- **Live / synchronous multiplayer** via WebSockets (rooms + shared countdown).
- **AI-generated questions** (admin approves before they go live).
- **Cross-game / all-time leaderboards** within the friend group.
- **Categories as a spinning-wheel mechanic** (Trivia Crack style).
- **Richer stats** — accuracy by category, win streaks.

---

## 13. Suggested build order

1. **Design tokens + component library** translated from `Trivyy.dc.html` into the React client.
2. **Postgres schema (v2) + question/category import script.**
3. **Core REST API** — sessions, solo flow, answer submission, scoring (pure).
4. **Solo gameplay frontend** (setup → play → results + review).
5. **Duel** — create, play-first, code/link, join, head-to-head result (with result polling).
6. **Play together** — host create, lobby with QR + polling, join, sequential play, leaderboard.
7. **Admin** — login, dashboard stats, question CRUD + hide/unhide, category management.
8. **Deploy to the Pi behind the Cloudflare Tunnel.**

v3 builds on this in dependency order (each its own PR → green CI → deploy):
**A. Accounts** → **B. Friends** → **C. Groups + rematch + standings** → **D. Regional questions** (D is independent of A–C). See §14.

---

## 14. Social layer (v3)

The social features are **opt-in** and layer onto the existing identity without breaking guest play or any v1/v2 flow.

### 13.1 Accounts (optional)

- A guest is `nickname` + browser session, as today. **Registering upgrades that same `players` row in place** (sets `username`, `password_hash`, `recovery_code_hash`, `is_registered`, `invite_code`), so the player keeps their nickname, scores, and answer history.
- Auth is **username + argon2 password**. The server prefers a registered `playerId` in the session and falls back to the guest nickname/session otherwise.
- **Recovery = a one-time code** shown exactly once at registration (copy-to-save), stored only as an argon2 hash. Reset takes username + code + new password. **No email is sent.** Login and reset are rate-limited (reusing the admin pattern).

### 13.2 Friends

- Connect two ways: **username search → request → accept** (symmetric), and a **personal invite link** (`?friend=CODE`) that sends/accepts a request on open. Decline and pending lists supported.
- **Friends leaderboard:** cumulative points (total correct answers) over me + accepted friends, derived on read (API-8). Not global.

### 13.3 Groups + rematch

- A **persistent group** is a named set of players with an owner and a reusable join `code` (distinct from a single-use game code, SEC-4). Invite by code/link or from your friends.
- The group can **launch a `together` game** seeded from its members; **"rematch" is the same launch call again** — the same group plays another round on a fresh locked set. Games carry `group_id` so rounds aggregate.
- **Group standings:** cumulative points across all the group's games, derived (API-8). A rematch updates the running tally. There is no schedule — the owner starts each round manually.

---

## Attribution

Question content sourced from the Open Trivia Database under CC BY-SA 4.0. Attribution displayed in the app footer or an about page.
