# Trivyy UI Overhaul — Design

**Date:** 2026-06-21
**Status:** Approved direction; Phase 0 ready for implementation planning.

## Context

Trivyy is a turn-based trivia web app (React + Vite SPA, Express + Postgres API,
hosted on a Raspberry Pi behind a Cloudflare Tunnel). It is feature-complete for
solo / duel / group play, optional accounts, friends, persistent groups, regional
questions, profile stats, and admin curation + analytics.

The goal of this work is a **complete visual and experiential overhaul**: the app
should feel like a polished, modern game (in the spirit of Trivia Crack) rather
than a functional prototype. This is a large effort spanning several subsystems,
so it is decomposed into phases, each its own spec section, PR, green CI, and
deploy.

The codebase already has a design foundation that this overhaul evolves rather
than replaces: a token system (`client/src/styles/tokens.css`, extracted from the
Claude Design prototype at `design/Trivyy.dc.html`), self-hosted fonts via
`@fontsource` (Fredoka display, Plus Jakarta Sans body), and a component library
(`AppFrame`, `Button`, `CategoryTile`, `QuestionCard`, `LeaderboardRow`,
`PlayerHeader`, and more).

## Locked decisions

- **Visual direction:** playful, rounded, saturated; game-like, not minimal.
- **Brand accent:** electric blue (replaces the current violet `--accent`).
- **Iconography:** custom SVG icons and illustrations; no stock emoji in UI chrome.
- **Build order:** Phase 0 (foundation) first; everything else layers on it.
- **Avatars:** photo upload AND preset characters/colors.
- **Motion:** go big. Framer Motion for transitions everywhere; Lottie animations
  and a true 3D spin-wheel where they add the most (duel + motion-pass phases).
- **Navigation stays query-param based** (no router library swap); a persistent
  bottom nav drives the existing `?duel`, `?friends`, `?me`, etc. scheme.

## Phase breakdown

| Phase               | Scope                                                                                        | New persistence                               |
| ------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------- |
| **0 · Foundation**  | Blue rebrand, dark mode, bottom nav, PWA / full-screen, Framer Motion foundation             | none — **implemented**                        |
| **1 · Profiles**    | Profile redesign, avatar (upload + presets), level / XP, achievement badges                  | `players` avatar + xp columns; `achievements` |
| **2 · Social**      | Friends bar, online presence (last-seen), shareable completion-badge "stories" (no comments) | `presence`, `stories`                         |
| **3 · Duel polish** | Animated VS intro, spin-the-wheel category picker (3D), rematch                              | optional `games.wheel_state`                  |
| **4 · Results**     | Podium, animated congrats screen, leaderboard polish                                         | none (leaderboards stay derived, API-8)       |
| **5 · Motion pass** | Transitions, confetti, answer feedback, sound + haptics across the app                       | none                                          |

Phases 3-5 reuse the foundation and data from 0-2. Each phase ships independently.

## Phase 0 — Foundation (detailed)

Five pieces, layered onto the existing component library and tokens. No per-screen
redesigns in this phase; Phase 0 makes the new look, shell, dark mode, and install
work everywhere, so later phases redesign individual screens on a stable base.

### 1. Rebrand to electric blue

Retune the accent tokens in `tokens.css` (`--accent`, `--accent-strong`,
`--accent-soft`, `--accent-glow`, accent shadows) from violet to electric blue.
Because components consume `var(--accent)` (ARC-3), this re-skins the whole app in
one file. The six category colors are preserved.

### 2. Dark mode (new)

- Add a `[data-theme="dark"]` block in `tokens.css` overriding surfaces, ink,
  borders, and tracks; accent and category hues are reused with tuned glows.
- A small `ThemeProvider` (React context) sets `data-theme` on `<html>`, persists
  the choice to `localStorage`, and defaults to the OS `prefers-color-scheme`.
- A toggle in Settings. The `<meta name="theme-color">` updates with the theme.
- **Constraint:** no raw colors in components; every dark value comes from a token
  (extends the existing ARC-3 rule).

### 3. Bottom nav (new)

- A persistent `BottomNav` component: Home · Friends · raised center **Play** ·
  Boards · You. It drives the existing query-param navigation.
- Rendered by the app shell on the primary tab screens; **hidden during an active
  game / question screen** so play is uninterrupted.
- Active-tab state derives from the current query params.

### 4. PWA / full-screen (new)

- Add `vite-plugin-pwa`: a web manifest (`display: standalone`, blue
  `theme_color`, maskable app icons), and a service worker that caches the app
  shell for offline/instant loads (the API is always network).
- An "Add to Home Screen" affordance (Settings + a dismissible prompt).
- Layout uses `100dvh` and `env(safe-area-inset-*)` so the app fills the phone
  with no browser chrome and respects notches / home indicators.

### 5. Motion foundation (new)

- Add **Framer Motion**. Standardize page and element transitions (fade-up,
  pop-in) on the existing keyframe vocabulary in `tokens.css`.
- Respect `prefers-reduced-motion` (transitions degrade to instant).
- Lottie and the 3D spin-wheel are explicitly deferred to Phases 3 and 5; Phase 0
  only establishes the transition primitives they build on.

### Architecture & boundaries

- `ThemeProvider`, `BottomNav`, and the PWA setup are independent units with
  clear interfaces (theme context value; nav reads/writes query params; PWA is
  build config + a registration call). Each is testable in isolation.
- Many small files over few large ones (coding-style): a `theme/` folder
  (provider, hook, toggle), `components/BottomNav.tsx`, `pwa/` registration.

### Data flow

- Theme: OS preference or stored value → `ThemeProvider` → `data-theme` attribute
  → token cascade. No server involvement.
- Nav: tap → update `window.location` query params → `App.tsx` renders the flow.

### Testing

- Vitest + RTL: `ThemeProvider` (persistence, OS default, toggle), `BottomNav`
  (active tab from params, hidden during a game).
- Playwright: a screenshot of a primary screen in both light and dark (DOD-3).
- A Lighthouse / manifest check for PWA installability.
- Coverage gate stays >= 80% (DOD-1).

### Out of scope for Phase 0

Per-screen redesigns (home feed, profile, VS intro, wheel, results), avatar
upload, presence, stories, achievements. Those are Phases 1-4.

## Cross-cutting concerns

- **Presence (Phase 2):** a last-seen heartbeat (the client pings a lightweight
  endpoint; "online" = active within a short window). No WebSockets; real-time
  sync stays a non-goal and is heavy on a Pi.
- **Avatar storage (Phase 1):** uploads stored on a Pi disk volume; validate
  content type and size, cap dimensions, strip EXIF, and serve from a path that is
  not user-controlled. Presets are static assets with no upload surface. Image
  upload is real attack surface and gets a security review (SEC rules).
- **Stories (Phase 2):** a shareable trivia-completion badge only, no comments;
  modeled as a short-lived activity row with an expiry. Reactions and comments are
  out of scope.
- **Leaderboards** remain derived (API-8); no ranking tables. The podium and
  result screens are presentation over existing derived data.
- **Security & config:** no secrets in code or logs (SEC-1, OBS-1); env-driven
  config (CODE-3). New upload and presence endpoints are validated (CODE-2) and
  rate-limited where appropriate.
- **Migrations** stay additive, `.cjs`, numbered +1000 (DB-2).

## Non-goals (unchanged)

Real-time / WebSocket sync, AI-generated questions, global/all-time leaderboards
(scoped only), email / social OAuth login, native apps, scheduled competitions,
monetization / shop, user-generated quizzes, in-app comments.
