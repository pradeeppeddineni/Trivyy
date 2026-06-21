# Trivyy UI Overhaul — Phase 5 (Motion pass: transitions, answer feedback, sound + haptics)

> Subagent-driven. Builds on Phases 0-4. Frontend-only. The final polish pass.

**Goal:** Make the whole app feel alive: screen transitions, satisfying answer feedback (motion + optional sound + haptics), and a user setting to control sound/haptics. Everything reduced-motion aware and resilient.

## Pieces (`client/src`, tokens only, no emoji)

**1. Feedback preferences** `client/src/feedback/prefs.ts` — a tiny localStorage-backed store mirroring the ThemeProvider pattern: `getFeedbackPrefs()`/`setFeedbackPrefs({sound, haptics})` returning `{ sound: boolean; haptics: boolean }` (default both true), guarded against storage errors. Optionally a `useFeedbackPrefs()` hook.

**2. Feedback engine** `client/src/feedback/feedback.ts` — pure-ish, fully guarded:

- `playTone(kind: 'correct'|'wrong')` — short Web Audio beep (no asset files): correct = a pleasant high ding, wrong = a low buzz. Lazily create/reuse a single `AudioContext`; if `window.AudioContext`/`webkitAudioContext` is unavailable (jsdom/SSR) do nothing.
- `vibrate(kind)` — `navigator.vibrate` if present (short for correct, double for wrong); guarded.
- `signal(kind)` — reads prefs and fires tone (if sound on) + vibrate (if haptics on). Never throws.
- Must be safe to import and call in jsdom (no AudioContext) without error.

**3. Answer feedback motion** — in `AnswerPill.tsx` (and/or `Gameplay.tsx`): on `correct` state add a green pulse (reuse the `okpulse`/`pulseRing` keyframe), on `incorrect` add a brief red shake (add a `shake` keyframe to tokens.css). When a player's answer is graded, call `signal('correct'|'wrong')` once. Respect `prefers-reduced-motion` (no shake/pulse; sound/haptics still optional per prefs). Keep AnswerPill's existing props/states and the A/B/C/D badges.

**4. Page transitions** — apply the existing `PageTransition` (Phase 0) to the main screen renders so navigating between Home/Setup/Profile/Friends/Boards fades-and-rises. Apply at a level that does NOT delay content availability for E2E (PageTransition animates opacity/translate but mounts children immediately — verify the existing E2E still passes). Do not wrap the in-game question stream in a way that adds per-question delay that could destabilize timing.

**5. Settings wiring** — in `SettingsFlow.tsx`, add "Sound" and "Haptics" toggles (reuse the ThemeToggle switch style or a shared `Switch`) bound to the feedback prefs.

## Gallery

Add a small "Feedback (Phase 5)" section: buttons to trigger `signal('correct')`/`signal('wrong')` and an `AnswerPill` showing the correct (pulse) and incorrect (shake) states.

## Tests (RTL; add to coverage include)

- `prefs.ts`: defaults to both-on; round-trips; survives storage errors.
- `feedback.ts`: `signal` does not throw when AudioContext/vibrate are absent (jsdom); respects prefs (mock prefs off → no vibrate call; spy on `navigator.vibrate`).
- `AnswerPill`: correct/incorrect states render with the expected feedback classes/styles (assert presence, not animation timing).
- Settings: the Sound/Haptics toggles flip and persist.

## Verification

- Gates green (typecheck/lint/format, server+client unit, build). No migration.
- E2E: the solo/duel/group specs play through questions — confirm `PageTransition` + answer motion do NOT break selectors or timing (read the specs; transitions must not gate content). Update specs only if necessary.
- Visual QA: screenshot `?gallery` AnswerPill correct/incorrect states; spot-check a page transition.
- PR → green CI → squash-merge → batched deploy.

## After Phase 5

This completes the overhaul (Phases 0-5). Update the design doc status and prepare the single batched deploy command for the user (all phases + the earlier merged PRs + the India seed).
