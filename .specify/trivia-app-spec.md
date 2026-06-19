# Trivia App — Specification (v1)

**Status:** Draft for workshop
**Last updated:** June 19, 2026
**Scope:** Self-hosted, turn-based trivia web app for friends, hosted on a Raspberry Pi.

---

## 1. Overview

A web-based trivia game inspired by TriviaDuel and Trivia Crack, built as a group workshop project. Players answer multiple-choice questions either solo or against a friend in a turn-based match. The app is hosted at home on a Raspberry Pi, backed by a Postgres database, and exposed to the public internet through a Cloudflare Tunnel on a custom domain.

The core idea: questions are seeded once from a free public trivia source into our own database, then curated and extended by an admin over time. Players need no account — they pick a nickname. Only the admin logs in.

---

## 2. Goals and non-goals

### Goals (v1)

- Players can play a **solo** game (answer a set of questions, get a score).
- Players can **invite a friend** to a **turn-based** match using a shareable game code or link.
- Players **self-identify with a nickname**; no registration required.
- An **admin** can log in to view statistics, add questions, edit questions, and hide bad questions.
- Questions are **pre-seeded** from the Open Trivia Database and curated locally.
- The app is reachable on a custom domain via Cloudflare Tunnel, with no open router ports.

### Non-goals (v1, deferred)

- Real-time / live synchronous multiplayer (both players on the same question at once). _Turn-based only for v1._
- Player accounts, passwords, or social login.
- AI-generated questions.
- Mobile native apps.
- Horizontal scaling / Redis / multiple server processes.
- Global public leaderboards beyond the friend group.

---

## 3. Users and roles

| Role       | Auth                              | Capabilities                                                                                                               |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Player** | None (nickname + browser session) | Start solo game, create/join a turn-based match, answer questions, view own and match results                              |
| **Admin**  | Login required                    | Everything a player can do, plus: view statistics, add questions, edit questions, hide/unhide questions, manage categories |

A player's identity is a nickname plus a browser session (cookie). This lets us attribute scores and match history to a player within the friend group without real accounts. A returning player keeps the same session as long as the cookie persists.

---

## 4. Gameplay

### 4.1 Solo mode

1. Player enters a nickname (if not already in session).
2. Player optionally picks category and difficulty (or "any").
3. The app serves a fixed number of questions (e.g. 10) drawn from the database, excluding questions the player has already seen where possible.
4. Each question is multiple choice: one correct answer, three incorrect answers, presented in randomized order.
5. Player answers; the app records correctness.
6. At the end, the player sees their score and a per-question review.

### 4.2 Turn-based multiplayer (asynchronous)

This is the TriviaDuel-style model, simplified. The two players do **not** need to be online at the same time.

1. Player A starts a match, picks settings (category, difficulty, number of rounds), and gets a **game code** (and/or shareable link).
2. Player A plays their round on a fixed set of questions for the match.
3. Player A shares the code/link with Player B.
4. Player B opens the link, enters a nickname, and plays **the same set of questions**.
5. Once both rounds are complete, the match is scored and a winner is shown (higher correct count; ties allowed or broken by total answer time if time is tracked).

Key rule: both players answer **the same question set** for a fair comparison. The set is locked when the match is created.

### 4.3 Scoring (starting point)

- Correct answer: +1 (optionally weight by difficulty later).
- Incorrect or no answer: 0.
- Winner = higher score. Tie = draw (or tiebreak on total time if implemented).

Scoring rules are intentionally simple for v1 and can be tuned after playtesting.

---

## 5. Questions and data sourcing

### 5.1 Decision: pre-seeded + admin-curated (not live API reads)

Questions are imported **once** from the Open Trivia Database (OpenTDB) into our own Postgres table. OpenTDB is the **import source**; Postgres is the **system of record**; the admin UI is the **ongoing curation layer**.

Rationale:

- **Reliability** — no game-time dependency on an external API being up.
- **No duplicate-tracking headache** — we control what each player has seen with a local query, instead of relying on expiring API session tokens.
- **Admin editing only works locally** — the admin can only fix/add/hide questions if they live in our database.
- **We still get OpenTDB's content** — "pre-seeded" just means we pull from OpenTDB once, then own the data.

Live API reads only make sense without a database, and we want a database anyway.

### 5.2 Source

- **Primary:** Open Trivia Database (`https://opentdb.com/api.php`). Free, no API key. Data is licensed under Creative Commons Attribution-ShareAlike 4.0 (attribution required).
- **Optional secondary (later):** The Trivia API (`the-trivia-api.com`) for additional variety. Has a usable free tier; review terms before any commercial use.

### 5.3 Import (seed) process

A one-time script that:

1. Loops OpenTDB requests (using a session token to avoid duplicates) until a target count is reached (suggested: a few thousand questions across all categories and difficulties).
2. **Decodes HTML entities** in question and answer text (OpenTDB returns encoded text).
3. Normalizes each question into our schema: question text, correct answer, incorrect answers, category, difficulty, source.
4. Deduplicates on question text.
5. Inserts into the `questions` table.

The script is re-runnable to top up the question pool.

### 5.4 Admin curation

The admin can, through the web UI:

- Add a new question manually (question, 1 correct + 3 incorrect answers, category, difficulty).
- Edit any existing question.
- Hide a question so it stops appearing in games (soft delete via a status flag — never hard-delete, to preserve match history references).
- Manage the category list.

---

## 6. Architecture and tech stack

```
[ Player / Admin browser ]
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
 (Node/Express  (questions, players,
  + React)       games, answers, stats)
```

### Components

- **Frontend:** React. Most reference projects use it and there are many examples to learn from.
- **Backend:** Node.js + Express. Plain REST API — no WebSockets needed for turn-based play.
- **Database:** Postgres, running locally on the Pi. Holds questions, players, games, answers, and derived stats.
- **Admin auth:** A battle-tested auth library (do not roll your own). Single admin user for v1.
- **Exposure:** `cloudflared` named tunnel mapping the custom domain to `localhost` on the Pi. No router ports opened, home IP not exposed.
- **Process management:** Run the app and `cloudflared` under systemd (or Docker) so they survive reboots. Managing `cloudflared` at the OS level helps the Pi reliably regain tunnel connectivity after a reboot.

### Why no WebSockets / no Redis in v1

Turn-based play is request/response: a player loads questions, submits answers, and the result is computed when both rounds finish. None of that needs a persistent live connection. Live state in memory plus durable state in Postgres is enough; Redis only becomes relevant when running multiple server processes, which we are not.

---

## 7. Data model (initial sketch)

> Indicative, not final. Refine during the schema build.

**players**

- `id` (pk)
- `nickname`
- `session_token` (maps to browser cookie)
- `created_at`

**questions**

- `id` (pk)
- `text`
- `correct_answer`
- `incorrect_answers` (array or related table)
- `category`
- `difficulty` (easy / medium / hard)
- `source` (e.g. "opentdb", "admin")
- `status` (active / hidden)
- `created_at`, `updated_at`

**games**

- `id` (pk)
- `mode` (solo / duel)
- `game_code` (for duel invites)
- `category`, `difficulty`, `num_questions`
- `question_ids` (the locked set for this game)
- `status` (open / in_progress / complete)
- `created_at`

**game_players**

- `id` (pk)
- `game_id` (fk)
- `player_id` (fk)
- `role` (creator / opponent)
- `score`
- `completed_at`

**answers**

- `id` (pk)
- `game_id` (fk)
- `player_id` (fk)
- `question_id` (fk)
- `selected_answer`
- `is_correct`
- `answered_at`

---

## 8. API surface (initial sketch)

> Indicative REST endpoints. Auth-gated admin routes marked.

**Players / session**

- `POST /api/session` — set or update nickname, issue session.
- `GET /api/me` — current player info.

**Solo + duel games**

- `POST /api/games` — create a game (solo or duel); returns game + code for duels.
- `GET /api/games/:code` — fetch a game by code (to join a duel).
- `POST /api/games/:id/join` — opponent joins a duel.
- `GET /api/games/:id/questions` — the locked question set for this game.
- `POST /api/games/:id/answers` — submit an answer.
- `POST /api/games/:id/complete` — finalize a player's round.
- `GET /api/games/:id/result` — match result once both rounds complete.

**Admin (auth required)**

- `POST /api/admin/login`
- `GET /api/admin/stats` — usage statistics.
- `GET /api/admin/questions` — list/filter questions.
- `POST /api/admin/questions` — add a question.
- `PUT /api/admin/questions/:id` — edit a question.
- `PATCH /api/admin/questions/:id/status` — hide/unhide.
- `GET/POST /api/admin/categories` — manage categories.

---

## 9. Hosting and deployment notes

- **Domain:** Required for a Cloudflare named tunnel. Buying the domain through Cloudflare is the smoothest path.
- **Tunnel:** Install `cloudflared` on the Pi, create a named tunnel, route the domain to the local web app port.
- **No open ports:** All traffic is outbound from the Pi to Cloudflare's edge.
- **TLS:** Handled at Cloudflare's edge.
- **WebSocket note (for the future):** If/when live multiplayer is added, WebSockets proxy through the tunnel with no extra config — but if the route sits behind a Cloudflare Access policy, set that route to bypass to avoid spurious 302/502 errors on the socket connection.

---

## 10. Open decisions

- **Score weighting:** flat +1 per correct answer, or weight by difficulty?
- **Tiebreaks:** allow draws, or track total answer time as a tiebreaker?
- **Stat persistence:** how long should a returning player's history survive (cookie lifetime)?
- **Seed size and category mix:** how many questions to import, and from which categories?
- **Time limits per question:** none in v1, or a soft countdown for flavor?

---

## 11. Future phases (post-v1)

- **Live / synchronous multiplayer** via WebSockets (Socket.IO) with rooms and a countdown timer.
- **AI-generated questions** — backend calls an LLM to draft fresh questions on a topic; admin approves before they go live.
- **Leaderboards** — weekly/all-time within the friend group.
- **Categories as a spinning-wheel mechanic** (Trivia Crack style).
- **Richer stats** — accuracy by category, win streaks.

---

## 12. Suggested build order

1. **Postgres schema + question import script** — unblocks everything else.
2. **Core REST API** — sessions, solo game flow, answer submission, scoring.
3. **Solo gameplay frontend.**
4. **Turn-based duel** — game codes, join flow, locked question sets, match results.
5. **Admin auth + question management + stats.**
6. **Deploy to the Pi behind the Cloudflare Tunnel.**

---

## Attribution

Question content sourced from the Open Trivia Database under CC BY-SA 4.0. Attribution to be displayed in the app footer or an about page.
