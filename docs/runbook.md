# Trivyy Runbook (Raspberry Pi)

Operational guide for the Pi deployment (OP-5). The app runs behind a Cloudflare
Tunnel with no open ports (OP-3, OP-4). Public domain: **trivyy.com**.

## Architecture

```
Browser → Cloudflare edge (TLS) → cloudflared tunnel (outbound) → Pi (Docker Compose)
                                                                   ├─ client  (nginx: SPA + /api proxy)
                                                                   ├─ server  (Express API)
                                                                   └─ db      (Postgres + volume)
```

No host ports are published. The only ingress is the outbound `cloudflared`
connector; the router needs no port forwarding.

---

## First-time setup

### 1. DNS: domain on Cloudflare

- Add `trivyy.com` to Cloudflare (Add a site → Free plan).
- At GoDaddy, set the domain's nameservers to the two Cloudflare nameservers.
- Wait until the zone shows **Active** in Cloudflare. (Done.)

### 2. Create the tunnel (Cloudflare Zero Trust dashboard)

1. Zero Trust → **Networks → Tunnels → Create a tunnel** → _Cloudflared_ → name
   it `trivyy-pi`.
2. Copy the **connector token** it shows (a long `eyJ...` string). This is
   `TUNNEL_TOKEN`. Do not commit it.
3. Under the tunnel's **Public Hostname** tab, add a route:
   - **Subdomain:** _(blank)_ **Domain:** `trivyy.com`
   - **Type:** `HTTP` **URL:** `client:8080`
   - Optionally add `www` → same service.
     Cloudflare creates the proxied DNS (CNAME) records automatically.

> The token wires the Pi's connector to this route; you do not need a
> `config.yml` or `cert.pem` on the Pi.

### 3. Pi prerequisites

```bash
docker --version && docker compose version   # Compose v2 plugin
uname -m                                      # aarch64 expected (64-bit Pi)
```

### 4. Clone + configure

```bash
git clone https://github.com/pradeeppeddineni/Trivyy.git
cd Trivyy
cp .env.example .env
```

Edit `.env` and set real values:

```bash
NODE_ENV=production
APP_DOMAIN=trivyy.com
POSTGRES_PASSWORD=<strong-random>            # openssl rand -hex 24
SESSION_SECRET=<strong-random>               # openssl rand -hex 32
ADMIN_PASSWORD_HASH=<argon2 hash>            # npm run hash-admin -- 'your-admin-password'
TUNNEL_TOKEN=<connector token from step 2>
```

`DATABASE_URL` / `CLIENT_ORIGIN` are derived by the prod compose from the above
— leave the dev values as-is; they are not read by `docker-compose.prod.yml`.

---

## Deploy

```bash
# From the repo root on the Pi:
git pull origin main
docker compose -f docker-compose.prod.yml up -d --build

# Apply migrations (one-off container; the app does not auto-migrate).
docker compose -f docker-compose.prod.yml run --rm server npm run migrate

# Seed questions. Either the real OpenTDB import:
docker compose -f docker-compose.prod.yml run --rm server npm run seed
# …or, for a quick smoke set, the deterministic fixture:
docker compose -f docker-compose.prod.yml exec -T db \
  psql -U trivyy -d trivyy < server/tests/fixtures/questions.sql
```

### Verify

```bash
# Containers healthy:
docker compose -f docker-compose.prod.yml ps

# Health check through the tunnel (off-network — works from any machine):
curl -s https://trivyy.com/api/health        # → {"status":"ok"}

# App loads (note the CSP header):
curl -sI https://trivyy.com/                  # → 200

# Then in a browser at https://trivyy.com: enter a nickname → Play solo →
# answer through → see the review. That is the Phase 6 end-to-end check.
```

---

## Restart

```bash
docker compose -f docker-compose.prod.yml restart server
docker compose -f docker-compose.prod.yml restart        # whole stack
```

## View logs

```bash
docker compose -f docker-compose.prod.yml logs -f server      # structured JSON (OBS-1)
# Trace one game end to end by its game id (OBS-2):
docker compose -f docker-compose.prod.yml logs server | grep '"gameId":"<id>"'
docker compose -f docker-compose.prod.yml logs -f cloudflared # tunnel connector
```

## Roll back

```bash
git checkout <previous-good-tag>
docker compose -f docker-compose.prod.yml up -d --build
# Roll back the last migration only if the new release added one:
docker compose -f docker-compose.prod.yml run --rm server npm run migrate:down
```

## Tunnel health

```bash
docker compose -f docker-compose.prod.yml logs cloudflared | tail -n 30
# In the dashboard: Zero Trust → Networks → Tunnels → trivyy-pi shows "Healthy".
```

If a future synchronous-play phase adds WebSockets behind a Cloudflare Access
policy, set that route to **bypass** to avoid spurious 302/502 on the socket.

## Incident checklist

1. Confirm scope: tunnel down vs app down vs DB down
   (`docker compose -f docker-compose.prod.yml ps`).
2. Capture logs before restarting.
3. Restart the smallest failing component first.
4. If a release caused it, roll back to the last good tag.
5. Record a short post-incident note as an ADR if a decision changed.
