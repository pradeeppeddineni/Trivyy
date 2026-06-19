# Trivyy Runbook (Raspberry Pi)

Operational guide for the Pi deployment (OP-5). The app runs behind a Cloudflare
Tunnel with no open ports (OP-3, OP-4).

## Architecture

```
Browser → Cloudflare edge (TLS) → cloudflared tunnel (outbound) → Pi
                                                                    ├─ app (Docker / systemd)
                                                                    └─ Postgres
```

## Deploy

```bash
# On the Pi, from the repo root:
git pull origin main
docker-compose pull            # if using prebuilt images
docker-compose up -d --build
docker-compose exec server npm run migrate   # apply new migrations
```

## Restart

```bash
docker-compose restart server
# or, if running under systemd:
sudo systemctl restart trivyy
```

## View logs

```bash
docker-compose logs -f server      # structured JSON logs (OBS-1)
# Trace one game end to end by its game id (OBS-2):
docker-compose logs server | grep '"gameId":"<id>"'
```

## Roll back

```bash
git checkout <previous-good-tag>
docker-compose up -d --build
# Roll back the last migration only if the new release added one:
docker-compose exec server npm run migrate:down
```

## Tunnel health

```bash
cloudflared tunnel info trivyy
sudo systemctl status cloudflared
```

If WebSockets are added later and sit behind a Cloudflare Access policy, set that
route to bypass to avoid spurious 302/502 errors on the socket connection.

## Incident checklist

1. Confirm scope: tunnel down vs app down vs DB down (`docker-compose ps`).
2. Capture logs before restarting.
3. Restart the smallest failing component first.
4. If a release caused it, roll back to the last good tag.
5. Record a short post-incident note as an ADR if a decision changed.
