# Trivyy UI Overhaul — Phase 1 (Profiles + Avatars + XP/Badges)

> Executed via subagent-driven development. Builds on Phase 0 (merged).

**Goal:** A redesigned profile screen with an avatar (upload + presets), a derived level/XP bar, and derived achievement badges.

**Scope calls (deviations from the design spec, with rationale):**

- **XP/level + achievements are DERIVED, not stored** (API-8): level and badges are computed from existing `points`/`answers`/games data by pure functions. No `achievements` table, no game-finish write-path change.
- **Avatar stored as a processed blob in Postgres** (`bytea`), resized to 256px webp with metadata stripped, rather than a disk volume — inherits existing DB persistence, no compose/mount change. Small (<50KB) for a small user base.

## Backend

**Migration** `server/migrations/1700000008000_avatar.cjs`:

- `players.avatar_preset` text null (a preset key like `'blue'`)
- `players.avatar_image` bytea null (processed webp bytes)
- `players.avatar_mime` text null
- `players.avatar_updated_at` timestamptz null
- down: drop the four columns.

**Domain** `server/src/domain/level.ts` (pure, unit-tested):

- `levelForPoints(points: number): { level: number; into: number; span: number; pct: number }` — thresholds (e.g. level n needs `100 * n * (n-1) / 2` cumulative points; pick a simple increasing curve). Returns current level and progress to next.

**Domain** `server/src/domain/achievements.ts` (pure, unit-tested):

- `computeAchievements(input: { games; points; answers; accuracyPct; bestStreak? }): ReadonlyArray<{ key; label; description; earned: boolean }>` — a fixed catalog (First Game, 10 Games, Centurion = 100 correct, Sharpshooter = >=90% accuracy with >=20 answers, High Scorer = >=1000 points, etc.). Pure mapping over stats.

**Service** `server/src/services/avatarService.ts`:

- `setUploadedAvatar(playerId, buffer, mime)` — validate mime in {image/png,image/jpeg,image/webp}; process with sharp: `resize(256,256,{fit:'cover'}).webp({quality:80})`, which also drops metadata; store bytea + mime `'image/webp'` + updated_at; clear preset.
- `setPresetAvatar(playerId, presetKey)` — validate key in a fixed set; set preset; clear image.
- `getAvatar(playerId)` — return `{ image: Buffer; mime } | null`.

**Routes** (extend `server/src/routes/session.ts` or a new `avatar.ts` mounted under `/api`):

- `POST /api/me/avatar` (multipart, field `image`) — requires a resolved player; rate-limited; max 2MB raw; 400 on bad type/size; 200 `{ ok: true }`.
- `POST /api/me/avatar/preset` (json `{ preset }`) — set a preset; 400 on unknown key.
- `GET /api/players/:id/avatar` — serve the processed image with `Content-Type` + `Cache-Control: private, max-age=300`; 404 when none.
- Extend `GET /api/me/stats` payload to include `avatar: { kind: 'none'|'preset'|'upload'; preset: string|null }`, `level` (from `levelForPoints`), and `achievements` (from `computeAchievements`).

Use `multer` (memory storage, 2MB limit) for the multipart parse; add `sharp` + `multer` (+ `@types/multer`) to `server/package.json`. Validate with zod where applicable (CODE-2). Never log image bytes (OBS-1).

**Tests:** unit for `level.ts` + `achievements.ts` (pure); integration for upload→serve roundtrip + preset + validation rejects (supertest, needs Postgres).

## Frontend

**Presentational** `client/src/components/ProfileView.tsx` — props: `{ nickname; level; xpPct; stats; achievements; avatar }`. Renders the mockup profile: cover band, avatar circle (image or preset color with initial) + camera button, name + level + XP progress bar, stats row (games/points/accuracy), achievements shelf, recent list. Tokens only.

**Avatar picker** `client/src/components/AvatarPicker.tsx` — preset swatches + an upload control; calls the API client; optimistic update.

**Flow** `client/src/pages/ProfileFlow.tsx` — fetch `/api/me/stats`, render `<ProfileView>`; open `<AvatarPicker>` from the camera button.

**API client** `client/src/api/client.ts` — `uploadAvatar(file)`, `setAvatarPreset(key)`, extend the stats type.

**Gallery** — add a `ProfileView` instance with realistic mock data to `client/src/pages/Gallery.tsx` so it renders without a backend (for visual QA + screenshots).

**Tests:** RTL for `ProfileView` (renders name/level/stats/badges), `AvatarPicker` (preset select calls handler); add to coverage include.

## Verification

- `npm run typecheck && lint && format:check`; server + client unit green; integration green in CI; client build green.
- Visual QA: screenshot `?gallery` profile vs the mockup; loop fixes until colors/feel match.
- PR → green CI (incl. migration up/down + 8-layer review + E2E) → squash-merge → batched deploy.
