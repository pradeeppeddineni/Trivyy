# 3. Three play modes, with group play via polling

Date: 2026-06-19

## Status

Accepted (supersedes the turn-based-only scope in ADR 0002 for gameplay; the stack from 0002 still holds)

## Context

The Claude Design prototype (`Trivyy.dc.html`) defines the product UI. It introduces a third play mode beyond the v1 spec's solo + asynchronous duel: a **"play together" group game** with a host-created lobby, invite by **code or QR**, a live-updating player roster, and a **leaderboard**. The group lobby and the duel "waiting for your friend" screen both need to reflect cross-device state changes (players joining, players finishing).

The original spec and `rules.md` made any live/synchronous multiplayer a deferred non-goal and locked a no-WebSocket stack. The group mode appears to reintroduce real-time needs.

## Decision

1. **Adopt the three-mode design**: solo, asynchronous duel, and group "play together". Per-game leaderboards are in scope; cross-game/global leaderboards remain out.
2. **Implement cross-device updates with short-interval client polling over REST**, not WebSockets. Group play is "one after another", so only the lobby roster/status and the duel result need to refresh — a cheap polled GET covers this. The no-WebSocket / no-Redis / single-process constraint stands.
3. **True synchronous play** (everyone on the same question at once, shared countdown) stays a deferred non-goal; the parked WebSocket rules return only if/when that phase begins.
4. **Reconcile `trivia-app-spec.md` (now v2) and `rules.md`** to this scope: `games.mode` gains `together`; `game_players` supports N players with host/player roles; add a `categories` table; add `lobby`, `result`, and `leaderboard` read endpoints (pollable); generalize invite codes to duel + group.

## Consequences

- All three modes ship in v1 without adding a socket layer, Redis, or a second process.
- Polling adds modest repeated load on the Pi; poll endpoints must be cheap and the interval bounded (API-7). Poll cadence is an open decision (~2–4s).
- The schema generalizes from 2-player duels to N-player games; the leaderboard and head-to-head are derived, not stored (API-8).
- QR codes are generated client-side from the join link; no server endpoint needed.
- The frontend is a mobile-first, multi-screen flow translated from the design prototype, not a desktop SPA.
- If synchronous play is later desired, it is a new ADR that revisits the WebSocket deferral.
