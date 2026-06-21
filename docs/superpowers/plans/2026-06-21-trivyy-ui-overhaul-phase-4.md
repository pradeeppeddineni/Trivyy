# Trivyy UI Overhaul — Phase 4 (Results: Podium + Congrats + Leaderboard polish)

> Subagent-driven. Builds on Phases 0-3. Frontend-only. Leaderboards stay derived (API-8) — this is presentation over existing result data.

**Goal:** A celebratory results experience: a top-3 podium, an animated congrats screen with confetti, and custom (non-emoji) leaderboard rank badges.

## Components (`client/src/components`, tokens only, no emoji)

**`Podium.tsx`** — props `{ entries: Array<{name, score, total?, avatar?, avatarSrc?}> }` (1-3 entries). Renders a 3-up podium: 1st centered + tallest + a crown (inline SVG), 2nd/3rd shorter; avatar circles (preset color + initial, or image), name, score. Bars rise on mount (Framer Motion / the existing `barRise` keyframe), reduced-motion safe.

**`ResultsScreen.tsx`** — props `{ title?, entries, meRank?, onPlayAgain?, onRematch?, playAgainLabel? }`. A celebratory panel: a confetti burst on mount (canvas-confetti, fired once; skipped under `prefers-reduced-motion`), "Congratulations!" heading, the `Podium` for the top 3, then the remaining ranks as `LeaderboardRow`s, and a primary action (Play again / Rematch). Add `canvas-confetti` (+ `@types/canvas-confetti`) to client deps; import dynamically/guarded so it never breaks render or tests (jsdom).

**Redesign `LeaderboardRow.tsx`** — replace the emoji `MEDALS` map with a custom rank badge: ranks 1/2/3 get a small gold/silver/bronze SVG/CSS medal disc with the number; ranks 4+ get a plain number. Keep the existing props and the winner highlight. Use tokens for the metal colors (add `--gold`/`--silver`/`--bronze` tokens to `tokens.css` if not present; they exist as `--gold` in the mockup — add what is missing).

## Integration

- Group result and duel result screens: use `ResultsScreen` (podium + ranked list + the existing rematch/play-again action). Keep the existing data flow; this is a presentational swap. Do NOT change result computation.
- Solo result: the existing `GradeBanner`/review stays, but the confetti-on-win can be reused if trivial; keep scope to multiplayer results if solo would expand scope.

## Gallery

Add `Podium` (3 mock players) and `ResultsScreen` (mock entries, a "replay" the confetti button) to `?gallery` for visual QA.

## Tests (RTL; add to coverage include)

- `Podium`: renders all entry names + scores; #1 shows the crown.
- `ResultsScreen`: renders the title, the podium names, the lower ranks, and calls `onPlayAgain`/`onRematch`; confetti import is guarded so the component renders in jsdom without throwing.
- `LeaderboardRow`: rank 1-3 render a medal badge (assert by accessible label/test id, NOT emoji); rank 4 renders the number; winner highlight applies. Update any existing LeaderboardRow test that asserted the emoji.

## Verification

- Gates green (typecheck/lint/format, server+client unit, build). No migration.
- E2E: the group/duel result specs may assert on leaderboard text — keep their selectors working (the medal change must not break `🥇`-based or text assertions; read `e2e/tests/duel.spec.ts` + `group.spec.ts` and update if needed).
- Visual QA: screenshot `?gallery` Podium + ResultsScreen vs the mockup leaderboard; loop fixes.
- PR → green CI → squash-merge → batched deploy.
