# 4. Admin authentication and session store

Date: 2026-06-19

## Status

Accepted (resolves spec §10 "admin identity"; refines the scaffold's password-only stub)

## Context

The scaffold authenticates a single admin with `express-session` + `argon2`, password-only, on the default in-memory session store. The Claude Design login screen draws a **username + password** form. The app is exposed to the public internet through a Cloudflare Tunnel, and runs as one process on a Raspberry Pi that restarts on deploy/reboot.

## Decision

1. **Identity: username + password**, single admin, no users table. `ADMIN_USERNAME` and `ADMIN_PASSWORD_HASH` (argon2id) come from env (SEC-1); plaintext is never stored. Verify both; always run `argon2.verify` even on a wrong username to avoid a timing oracle; return a generic `invalid_credentials`.
2. **Session store: Postgres via `connect-pg-simple`**, not MemoryStore. MemoryStore drops every session on each restart (admin logged out, players lose their nickname), warns in production, and is single-process only. A `session` table survives restarts, aligns with DB-1, and reuses Postgres. Created via migration (DB-2).
3. **Cookie:** `httpOnly`, `sameSite=lax` (so shared duel/group invite links carry the player session on top-level navigation), `secure` in production, signed with `SESSION_SECRET`. The app sets `trust proxy` so secure cookies work behind the Cloudflare Tunnel (it terminates TLS and forwards HTTP).
4. **Split lifetimes on one cookie:** long rolling player session (~30 days, SEC-3) but **short admin elevation** — store `adminLoginAt` and require admin re-login after ~12h; `requireAdmin` enforces it.
5. **Brute force:** `express-rate-limit` on `POST /api/admin/login` (~10 / 15 min per IP, keyed off the Cloudflare client IP). argon2id's slowness compounds the cost.
6. **CSRF:** layered without a token in v1 — `sameSite=lax` + CORS limited to our origin with credentials + JSON-only endpoints. A double-submit token / `__Host-` cookie prefix is future hardening.
7. **Audit:** emit `admin_login_succeeded` / `admin_login_failed` / `admin_logout` to the `events` table and a JSON log line (warn on failure), with no IP/PII (SEC-6). Rotate by regenerating the hash (`npm run hash-admin`) and restarting; bump `SESSION_SECRET` to invalidate all sessions on compromise (SEC-8).

## Consequences

- New deps: `connect-pg-simple`, `express-rate-limit`. New env var: `ADMIN_USERNAME`. New migration: `session` table.
- Admin and player sessions both persist across Pi restarts.
- Implemented in **Phase 5** (`env.ts`, `app.ts` trust-proxy + store + cookie, `admin.ts` username check + rate-limit + audit + elevation re-check).
- If multiple admins are ever needed, that is a new ADR introducing a users table.
