# Trivyy UI Overhaul — Phase 2 (Social: Friends bar + Presence + Stories)

> Subagent-driven. Builds on Phases 0-1. Friends already exist (search/request/accept/invite/leaderboard).

**Goal:** A friends/stories bar on the home screen showing who is online and friends' shareable trivia-completion "story" badges (no comments, no reactions).

**Scope calls (vs design spec):**

- **Presence = a `players.last_seen_at` column** (not a `presence` table): "online" = last_seen within 2 minutes. Updated by a lightweight ping. Derived, simplest.
- **Stories = a `stories` table** with an expiry (24h). A story is a trivia-completion badge only: `{ kind:'badge', label, detail }`. No comments/reactions (explicit non-goal).

## Backend

**Migration `1700000009000_presence_stories.cjs`:**

- `players.last_seen_at timestamptz null`.
- `stories` table: `id uuid pk default`, `player_id uuid not null references players(id) on delete cascade`, `kind varchar(16) not null` (only `'badge'` for now), `label text not null`, `detail text null`, `created_at timestamptz not null default now()`, `expires_at timestamptz not null`. Index `(player_id)` and `(expires_at)`.
- down: drop table + column.

**Presence** `server/src/services/presenceService.ts`:

- `touch(playerId)` — `UPDATE players SET last_seen_at = now() WHERE id = $1`.
- Online derivation helper used in friends list (`last_seen_at > now() - interval '2 minutes'`).
- Wire: `POST /api/presence/ping` (resolves current player, touches, returns `{ ok:true }`), rate-limited gently. Also call `touch` opportunistically is optional; keep the explicit ping endpoint.

**Stories** `server/src/services/storyService.ts`:

- `postStory(playerId, { kind:'badge', label, detail? })` — insert with `expires_at = now() + interval '24 hours'`; validate kind/label; cap one active story per (player, label) by upserting/replacing (so re-sharing the same badge does not stack). Returns the story.
- `listFriendStories(meId)` — active (`expires_at > now()`) stories from me + accepted friends, newest first, joined to player nickname + avatar meta. Returns `[{ id, playerId, nickname, label, detail, createdAt }]`.
- `myActiveStories(meId)`.

**Extend `friendService.listFriends`** to also return per-friend `online: boolean` (from last_seen) and `hasStory: boolean` (an active story exists) and avatar meta (`avatar.kind/preset`), so the friends bar can render rings/dots in one call. Keep existing fields.

**Routes** (`server/src/routes/stories.ts` + extend presence): `POST /api/presence/ping`; `POST /api/stories` (json `{ label, detail? }`, kind fixed 'badge'); `GET /api/stories/friends`. Gate on a resolved/registered player as friends routes do. Validate with zod (CODE-2). Update OpenAPI.

**Tests:** unit for the online-derivation + expiry boundary (pure helper extracted if practical); integration for ping→online, post story→appears in friends feed→expires, and the extended friends list shape.

## Frontend

**`FriendsBar`** `client/src/components/FriendsBar.tsx` — presentational horizontal scroller of friend avatars: a "+" (share your story) first, then friends. Each shows the avatar (reuse the avatar circle logic), a green online dot when `online`, and a gradient story ring when `hasStory`. Props: `friends`, `onAddStory`, `onOpenStory(friend)`. Tokens only, no emoji.

**`StoryViewer`** `client/src/components/StoryViewer.tsx` — a simple modal showing one badge story: the friend's name + the badge (trophy icon + label + detail). A close button. NO comment box, NO reactions.

**`ShareBadgeSheet`** — pick one of the player's earned achievements (from `/api/me/stats`) to share as a story; calls `postStory`.

**API client:** `pingPresence()`, `postStory({label,detail})`, `listFriendStories()`; extend the friends list type with `online`/`hasStory`/`avatar`.

**Integrate** the `FriendsBar` at the top of the home screen (the default/SoloFlow landing) for registered players; guests see a sign-in prompt instead. Start a small presence ping interval (e.g. every 60s) while the app is open.

**Gallery:** add `FriendsBar` (mock friends with mixed online/story states) and `StoryViewer` (mock badge) for backend-free visual QA.

**Tests:** RTL for `FriendsBar` (renders friends, online dot, story ring, add/open handlers) and `StoryViewer` (renders badge, close handler, NO comment input present). Add to coverage include.

## Verification

- Gates green (typecheck/lint/format, server+client unit, integration in CI, build).
- Visual QA: screenshot `?gallery` FriendsBar + StoryViewer vs the mockup home stories bar; loop fixes.
- PR → green CI (migration up/down + 8-layer + E2E) → squash-merge → batched deploy.
