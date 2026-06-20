# Trivyy Engineering Rules

The non-negotiable rules for building Trivyy, the solo / duel / group trivia game. This file is the scaled constitution and conventions for the project, derived from the Amida Engineering Playbook and the Amida Data Prism Constitution and trimmed to what this app actually needs.

**How to read it:** every rule is a testable SHALL statement with a stable ID (for example `SEC-2`). The ID prefix shows the source family so a student can trace it back to the Playbook or the Constitution. **Authority order** (highest wins): this file, then the spec for a given feature, then defaults. A change to this file SHALL go through a pull request with one approval.

**The locked stack:** Node.js with Express serving a plain REST API (the group lobby and the duel-result screen update via short-interval client polling; no WebSockets in v1), Postgres as the system of record with versioned migrations, a React + Vite mobile-first frontend, a battle-tested auth library for the single admin, Jest or Vitest with supertest and Playwright for tests, hosted on a Raspberry Pi behind a Cloudflare Tunnel at a real domain.

**The three modes:** solo (play alone), duel (asynchronous 1-v-1 on a shared locked set), and group "play together" (host creates a game; friends join by code or QR; everyone answers the same locked set one after another; a leaderboard ranks them). See the spec for details.

---

## Part I: Method and governance

- **SDD-1** Every unit of work SHALL trace to an issue (a GitHub issue or a Jira key).
- **SDD-2** Code SHALL NOT be written for a feature until a human approves its spec.
- **SDD-3** The spec, not the code, SHALL be the authoritative contract; divergence is resolved in the same pull request.
- **SDD-4** The spec, the rules, and any plans SHALL live in version control under `.specify/` or `docs/`.
- **DOD-1** A change is done only when all tests pass and total coverage is at least 80 percent, with no per-run override.
- **DOD-2** The agent SHALL present evidence (command output, a test result, or a screenshot), not a claim of success.
- **DOD-3** Any user-facing change SHALL be verified through Playwright with a screenshot before it is called done.
- **DOD-4** Affected docs (README, `.env.example`, this file) SHALL be updated in the same pull request.
- **DOD-5** A significant decision SHALL be recorded as a short ADR in `docs/adr/` (context, decision, consequences).

## Part II: Git and pull request workflow

- **GIT-1** Branches SHALL use a prefix: `feat/`, `fix/`, `refactor/`, `chore/`, `docs/`, or `test/`, lowercase with hyphens.
- **GIT-2** Feature branches SHALL live three days at most; large work is split into smaller pull requests.
- **GIT-3** Commit messages SHALL follow Conventional Commits, for example `feat(game): add duel join flow`.
- **GIT-4** A pull request SHALL open against `main`, fill in the template, and pass all checks before review.
- **GIT-5** Merging SHALL require at least one approval, all review conversations resolved, and green checks.
- **GIT-6** Merges SHALL be squash-only, so each pull request becomes one commit on `main`.
- **GIT-7** Direct pushes to `main` SHALL be blocked; all changes go through a pull request.
- **GIT-8** Pre-commit hooks SHALL run format, lint, trailing-whitespace, merge-conflict, and secret-detection checks.

## Part III: Repository governance

- **REPO-1** The repo SHALL contain a LICENSE, a README, a CONTRIBUTING guide, a CODEOWNERS file, and a pull request template.
- **REPO-2** `main` SHALL have branch protection: required pull request, one approval, conversation resolution, and passing checks.
- **REPO-3** The default branch SHALL be `main`.
- **REPO-4** `.gitignore` SHALL exclude `.env`, `node_modules`, build output (`dist/`, `build/`), coverage reports, and any key or credential files.
- **REPO-5** An `.env.example` SHALL document every environment variable with a description and no real values.
- **REPO-6** Dependency update alerts SHALL be enabled; HIGH or CRITICAL findings are addressed promptly.

## Part IV: Code quality

- **CODE-1** TypeScript SHALL be the implementation language for both the Express backend and the React frontend; ESLint and Prettier SHALL enforce lint and format, and public functions SHALL have explicit types.
- **CODE-2** API request and response bodies SHALL be validated and typed with zod schemas, never passed around as untyped objects.
- **CODE-3** Configuration SHALL come from environment variables, never hard-coded.
- **CODE-4** Functions SHALL stay under 50 lines and files under 800 (target 200 to 400).
- **CODE-5** Nesting SHALL stay at four levels or fewer; use early returns and guard clauses.
- **CODE-6** Every I/O operation SHALL have error handling, and error messages SHALL NOT expose internals.
- **CODE-7** Frontend code SHALL stay small and formatted; no secrets and no inline credentials.

## Part V: Architecture

- **ARC-1** The scoring and game-state logic SHALL be pure and unit-testable with no I/O, so unit tests need no database or network.
- **ARC-2** API handlers SHALL stay thin; business logic lives in a service layer.
- **ARC-3** Shared UI SHALL be built from one React component library and a single set of design tokens; raw hard-coded style values SHALL NOT appear in components.
- **ARC-4** Every screen SHALL define explicit loading, empty, error, and success states.

## Part VI: Data

- **DB-1** Postgres SHALL be the single store for application state and gameplay data, running locally on the Pi.
- **DB-2** Schema changes SHALL be made only through versioned migrations checked into the repo (for example node-pg-migrate or Knex); no hand-edited schema.
- **DB-3** Tables and columns SHALL use snake_case names.
- **DB-4** Queries SHALL avoid N+1 patterns and index the fields used to look up games (including the duel game code) and players.
- **DB-5** An `events` table SHALL record game lifecycle events, and it SHALL be the audit trail the admin dashboard reads.
- **DB-6** Questions SHALL be soft-deleted through a status flag (active or hidden), never hard-deleted, so match-history references stay intact.
- **DB-7** Imported question content SHALL retain its source field, and Open Trivia Database content SHALL be attributed under CC BY-SA 4.0 in the app.

## Part VII: API and requests

- **API-1** Every endpoint SHALL be described in an OpenAPI document checked into the repo, with a browsable API reference (for example Swagger UI) served in development.
- **API-2** All input SHALL be validated server-side with zod.
- **API-3** Errors SHALL return a clear JSON shape and SHALL NOT leak stack traces, SQL, or file paths.
- **API-4** Every endpoint SHALL have an integration test using supertest against the Express app.
- **API-5** Turn-based match state SHALL be persisted in Postgres after every answer submission, so either player can leave and resume an in-progress match later without both being online at once.
- **API-6** A game's question set SHALL be locked when the game is created and served identically to every player (both duel opponents, all group players), so the comparison is fair.
- **API-7** Cross-device updates (the group lobby roster and per-player status, and the duel result screen) SHALL use short-interval client polling of a lightweight GET endpoint, not WebSockets. Poll responses SHALL be cheap and SHALL NOT trigger heavy recomputation on every call.
- **API-8** Every leaderboard — a single group game's results, a duel head-to-head, a **persistent group's standings**, and a **friends leaderboard** — SHALL be **derived** on read from `game_players`, `answers`, and the membership/friendship tables, not stored as denormalized ranking rows. Standings are **cumulative points** (total correct answers) scoped to that group or friend set. **Global / all-time / cross-everyone leaderboards remain a non-goal.**

**Deferred (future phase):** live or synchronous play over WebSockets (everyone on the same question at once, with a shared countdown) is a v1 non-goal (see spec section 11). The WebSocket heartbeat, automatic reconnect, and server-held live-session rules return when that phase begins; v1 uses request/response plus short-interval polling for the lobby and result screens.

## Part VIII: Security (scaled to this app)

- **SEC-1** Secrets (database credentials, the admin password hash, the CI Anthropic API key used by the review agent, any tokens) SHALL come from environment variables and SHALL NEVER be committed.
- **SEC-2** Access SHALL use three roles enforced at the API layer: an anonymous **guest** player (nickname + session only), a **registered** player (an account), and an authenticated **admin**. The host/creator and opponent/player distinctions inside a game, and group ownership, are per-game / per-group data, not an auth boundary. Frontend checks are UX only.
- **SEC-3** Accounts SHALL be **optional**: guest play (nickname + browser session cookie, persisting across games) SHALL always remain available. A player MAY optionally register an account, identified by a unique **username** plus an argon2 **password** hash; registering upgrades the player's existing row in place so their history is preserved. Account features (friends, persistent groups, scoped leaderboards, cross-device history) require a registered account.
- **SEC-3a** Account recovery SHALL use a one-time **recovery code** shown exactly once at registration and stored only as an argon2 hash (never plaintext, never logged); a password reset requires the username plus that code. No email or third-party identity provider is used (SEC out-of-scope). Login and reset routes SHALL be rate-limited.
- **SEC-4** **Game** invite codes (duel and group games) SHALL be single-purpose: usable only to join the one game they belong to, and unusable once that game is complete. **Friend invite links and persistent-group invite codes** are reusable by design and are NOT game codes; they grant only a friend request / group membership, never admin or another user's data.
- **SEC-5** The app SHALL minimise player personal data; nicknames are treated as untrusted input and SHALL be length-limited and filtered. As an explicit, owner-authorized exception, the client IP and coarse location (ISO country, from Cloudflare's edge headers) MAY be captured and stored for the single-admin analytics dashboard only; this data SHALL NOT be exposed to players or to any non-admin surface.
- **SEC-6** Logs SHALL be structured and SHALL NOT contain anything beyond nicknames and gameplay events — in particular, IP and location SHALL be stored for analytics but SHALL NEVER be written to logs.
- **SEC-7** Production traffic SHALL use TLS, provided by the Cloudflare Tunnel; no plaintext HTTP.
- **SEC-8** A leaked secret SHALL be rotated immediately and removed from history.
- **SEC-9** Dependencies SHALL be scanned for known vulnerabilities, with none left unresolved at HIGH or CRITICAL.

**Out of scope on purpose:** NIST 800-53 mapping, Entra and MSAL identity, managed identities, private endpoints, PHI and HIPAA handling, and customer-managed keys. Name these in class as the enterprise version of the same ideas, but do not implement them on a trivia game.

## Part IX: Testing

- **TEST-1** Development SHALL be test-driven; tests are written before or with the code.
- **TEST-2** Total coverage SHALL be at least 80 percent, enforced in CI with no override.
- **TEST-3** The scoring logic SHALL have unit tests, including a correct answer, a wrong answer, an unanswered question, and a tie.
- **TEST-4** Critical flows (start a solo game; create and join a duel; host and join a group game; answer a question; view a duel result and a group leaderboard) SHALL have Playwright end-to-end tests.

## Part X: CI/CD and quality gates

- **CI-1** A CI workflow SHALL run on every pull request to `main`; a deploy-only workflow does not satisfy this.
- **CI-2** CI SHALL run lint, format, type check (`tsc`), tests with coverage, and the Playwright end-to-end suite, all as blocking steps with no `continue-on-error`.
- **CI-3** CI SHALL include a secret scan.
- **CI-4** An AI pull request review workflow (`pr-review.yml`) SHALL run the 8-layer review on every pull request using the Anthropic API.
- **CI-5** GitHub Actions SHALL be pinned to commit SHAs, and workflow permissions SHALL be least privilege.
- **CI-6** Both the test gate and the security scan SHALL be green before the first feature merges; gates are never retrofitted.

## Part XI: Observability

- **OBS-1** All logs SHALL be structured JSON; `console.log` SHALL NOT appear in committed code.
- **OBS-2** Each log line SHALL carry a game identifier so a single game can be traced end to end.
- **OBS-3** The admin dashboard SHALL read from the `events` table to show games, players, answer distributions, and response times.

## Part XII: Agentic workflow (the Claude Code part)

- **AGENT-1** The agent SHALL read the spec and produce a plan in plan mode before implementing a non-trivial change.
- **AGENT-2** The agent SHALL follow plan, implement, verify, and write tests before or with the code.
- **AGENT-3** The agent SHALL self-verify UI work through Playwright with a screenshot and SHALL NOT declare UI done without it.
- **AGENT-4** The repo SHALL maintain a `CLAUDE.md` and an `AGENTS.md` describing how to build, test, and verify.
- **AGENT-5** The agent SHALL open a pull request titled with the issue key, with a body generated from the diff.
- **AGENT-6** Agent capabilities SHALL be wired through MCP (GitHub, the issue tracker, and Playwright).

## Part XIII: Operations and hosting

- **OP-1** The README SHALL cover the description, prerequisites, local setup, environment variables, and how to run on the Pi.
- **OP-2** The repo SHALL run locally via `docker-compose up`, with onboarding under thirty minutes.
- **OP-3** The Pi SHALL run the app as a systemd service or a Docker container so it restarts on reboot.
- **OP-4** The public URL SHALL be served through a Cloudflare Tunnel, with no port forwarding and no static IP.
- **OP-5** A short runbook SHALL document how to deploy, restart, view logs, and roll back.

---

## Appendix: the Trivyy "every repo must have" checklist

- This `rules.md`, plus the feature spec under `.specify/` or `docs/`
- `CLAUDE.md` and `AGENTS.md`
- LICENSE, README, CONTRIBUTING, CODEOWNERS, and a pull request template
- A pre-commit config and a blocking `ci.yml`
- A `pr-review.yml` 8-layer review agent
- `.env.example` and a correct `.gitignore`
- Branch protection on `main`
- At least 80 percent coverage and a Playwright suite
- Versioned database migrations from the first schema
- A runbook for the Pi deploy
