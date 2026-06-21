# Trivyy UI Overhaul — Phase 3 (Duel polish: VS intro + Spin wheel + Rematch)

> Subagent-driven. Builds on Phases 0-2. Frontend-only — no schema/API changes (rematch reuses the existing create-duel API).

**Goal:** Make duels feel like a game: an animated VS intro with both players' avatars, a spin-the-wheel category picker, and a one-tap rematch.

## Components (all `client/src/components`, presentational + tokens only, no emoji)

**`VSIntro.tsx`** — props `{ left: {nickname, avatar, avatarSrc?}, right: {nickname, avatar, avatarSrc?}, onStart?: ()=>void, autoStartMs?: number }`. A vivid full-width panel: ROUND/VS framing, both avatar circles animate in (Framer Motion: left slides/pops from one side, right from the other, a lightning bolt scales+glows between them), names + sublabels, a START button (calls `onStart`). Reuse the avatar-circle logic (preset color + initial, or image via `avatarSrc`). Respect `prefers-reduced-motion` (no slide, instant). If `autoStartMs` set, auto-calls `onStart` after the intro.

**`SpinWheel.tsx`** — props `{ segments: Array<{key,label,color}>, onResult: (key)=>void, spinning?: boolean }`. A circular wheel (conic-gradient segments + segment labels) with a pointer; a SPIN button triggers a rotation animation (Framer Motion / CSS transform with cubic-bezier ease-out) that lands on a pseudo-random segment and calls `onResult(key)` when it settles. Add a subtle 3D feel with `perspective` + a slight `rotateX` tilt on the wheel container (the "go big / 3D" choice). Reduced-motion: snap to a result without the long spin. Deterministic-friendly: accept an optional `pickIndex` prop to force the landing segment (for tests).

**`RematchButton.tsx`** (or inline in DuelFlow) — a button that re-creates a duel with the same options (category/region/count) via `createDuelGame`, then shows the new code/QR (reuse existing invite UI).

## Integration

- **DuelFlow / JoinFlow:** show `VSIntro` when both players are known (creator sees it once the opponent joins; opponent sees it on join) before the first question. Avatars come from each player's avatar meta (extend the duel/lobby data if needed — but prefer using nickname-initial avatars if avatar meta is not already available on the lobby payload; do NOT add backend just for this — initials are an acceptable fallback and the image can come later).
- **Duel setup:** offer the `SpinWheel` as an alternative way to pick the category (a "Spin for it" toggle/button beside the existing category tiles). Landing on a segment selects that category.
- **Duel result:** add the `RematchButton`.

## Gallery

Add `VSIntro` (two mock players), `SpinWheel` (the 6 category segments), to `?gallery` for backend-free visual QA. The `SpinWheel` should be triggerable to show a spin.

## Tests (RTL; add to coverage include)

- `VSIntro`: renders both nicknames, the START button calls `onStart`; renders avatar initials.
- `SpinWheel`: renders all segment labels; clicking SPIN with a forced `pickIndex` calls `onResult` with the expected key (use fake timers or the forced index so it is deterministic); reduced-motion path resolves immediately.
- `RematchButton`: clicking calls the injected create handler with the prior options.

## Verification

- Gates green (typecheck/lint/format, client unit, build). No migration.
- Visual QA: screenshot `?gallery` VSIntro + SpinWheel vs the mockup VS + wheel screens; loop fixes until colors/feel match.
- PR → green CI (incl. E2E) → squash-merge → batched deploy.
