# 5. Pi deployment topology, Cloudflare Tunnel, and fonts (CDN interim)

Date: 2026-06-19

## Status

Accepted

## Context

Phase 6 takes Trivyy live on a Raspberry Pi at `trivyy.com` (OP-3, OP-4, OP-5).
Two decisions needed recording: how the app is served/exposed, and how fonts are
delivered given the strict CSP goal.

The spec (section 9) resolved exposure to a **Cloudflare named tunnel** with no
open router ports, TLS at the edge. It also left the fonts question open between
the Google Fonts CDN (Phase 0 interim) and self-hosting for a CSP with no
external origins.

## Decision

### Deployment topology

- The Pi runs the stack with **Docker Compose** (`docker-compose.prod.yml`):
  `db` (Postgres + named volume), `server` (Express API), `client` (nginx
  serving the built SPA and reverse-proxying `/api` -> `server`), and
  `cloudflared` (the tunnel connector).
- **No host ports are published.** The only ingress is the outbound-only
  `cloudflared` tunnel, so the home router needs no port forwarding (OP-4).
- TLS terminates at the **Cloudflare edge**; the tunnel forwards plain HTTP to
  nginx inside the Pi (SEC-7). The API sets `trust proxy` in production and
  nginx forwards `X-Forwarded-Proto: https`, so the `secure` session cookie is
  set correctly behind the proxy chain (ADR 0004).
- The tunnel uses a **token-based connector** (Zero Trust dashboard) rather than
  a `config.yml` + `cert.pem` on disk. The public-hostname route
  (`trivyy.com` -> `http://client:8080`) is configured in the dashboard; the
  connector token lives in `.env` as `TUNNEL_TOKEN` (a secret, never committed).
- GoDaddy remains the registrar; the domain's **nameservers point to
  Cloudflare** so the zone (and tunnel DNS routes) resolve through Cloudflare.

### Fonts: Google Fonts CDN interim, self-host path documented

- v1 production keeps loading **Fredoka + Plus Jakarta Sans from the Google
  Fonts CDN**, but the CSP is locked to exactly those two origins
  (`fonts.googleapis.com` for the stylesheet, `fonts.gstatic.com` for the font
  files) and `'self'` for everything else. No other external origin is allowed.
- Self-hosting is the desired end state (a pure `'self'` CSP, offline-capable),
  but requires committing the `.woff2` binaries, which the build environment for
  this phase could not download. `scripts/fetch-fonts.sh` plus a documented
  three-line change (import `@font-face`, drop the `<link>` tags, tighten the
  CSP) make the flip a small, reviewable follow-up.

## Consequences

- Deploy is reproducible from the repo: `docker compose -f
docker-compose.prod.yml up -d --build` + a migrate step (see the runbook).
- The attack surface is minimal: no open ports, no published container ports,
  one outbound tunnel, and a CSP that forbids all script/connect/frame origins
  except `'self'`.
- The CSP still trusts two Google origins for fonts. If Google Fonts is
  unreachable the page falls back to the system font stack (already the
  `--font-display` / `--font-body` fallback), so it degrades gracefully rather
  than breaking. Closing this is tracked as the self-host follow-up.
- Cloudflare sits in front of the app; if a future synchronous-play phase adds
  WebSockets behind a Cloudflare Access policy, that route must be set to bypass
  (already noted in the runbook).
