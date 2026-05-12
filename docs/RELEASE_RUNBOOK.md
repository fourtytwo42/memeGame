# Meme Foundry Release Runbook

This runbook covers the host-native release path for the VM build. Docker is a
later packaging stage and must not be used as the release gate until the
host-native app is complete, tested, hardened, and share-ready.

## Release Target

- VM: `192.168.50.209`
- Repo: `/home/hendo420/memeGame`
- Public entrypoint: Nginx on port `80`
- Internal services:
  - web: `127.0.0.1:3000`
  - realtime: `127.0.0.1:3001`
  - AI service: `127.0.0.1:3002`
  - Postgres: local only
  - Redis: local only
  - Ollama/local LLM: local only

## Preflight

Run from `/home/hendo420/memeGame`:

```bash
git status --short
git pull --ff-only
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm db:deploy
pnpm db:seed
```

Confirm environment:

```bash
node --version
pnpm --version
systemctl is-active postgresql redis-server nginx
curl -fsS http://127.0.0.1:11434/api/tags >/dev/null || true
```

Required `.env` posture:

- `AUTH_URL` and `NEXTAUTH_URL` point at the share URL.
- `DATABASE_URL` points at `meme_foundry`.
- `REDIS_URL` points at local Redis.
- `ADMIN_EMAILS` includes the admin email.
- No external AI or image API keys are required.
- Local AI/image fallback modes are acceptable only when the admin health panel
  and release evidence clearly show degraded behavior.

## Build And Verify

Run the release gate:

```bash
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
AI_TEXT_BURST_JOBS=100 \
IMAGE_BURST_JOBS=25 \
PLAYWRIGHT_BASE_URL=http://127.0.0.1:3000 \
pnpm test:release
```

Run full browser E2E separately:

```bash
pnpm world:refresh
pnpm test:e2e
```

Run security/dependency gate:

```bash
pnpm audit --audit-level high
```

Run browser-use visual/playtest audits from Codex against the live VM URL and
store evidence under `docs/evidence/`.

## Service Install Or Update

Install or refresh systemd templates:

```bash
sudo cp deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now meme-foundry-web meme-foundry-realtime
sudo systemctl enable --now meme-foundry-ai-service
sudo systemctl enable --now meme-foundry-worker-ai-text meme-foundry-worker-image
```

Install or refresh Nginx:

```bash
sudo cp deploy/nginx/meme-foundry.conf /etc/nginx/sites-available/meme-foundry.conf
sudo ln -sf /etc/nginx/sites-available/meme-foundry.conf /etc/nginx/sites-enabled/meme-foundry.conf
sudo nginx -t
sudo systemctl reload nginx
```

Restart release services after a code deploy:

```bash
sudo systemctl restart meme-foundry-web
sudo systemctl restart meme-foundry-realtime
sudo systemctl restart meme-foundry-ai-service
sudo systemctl restart meme-foundry-worker-ai-text
sudo systemctl restart meme-foundry-worker-image
```

## Health Checks

```bash
systemctl --no-pager --failed
systemctl status --no-pager meme-foundry-web meme-foundry-realtime
systemctl status --no-pager meme-foundry-ai-service meme-foundry-worker-ai-text meme-foundry-worker-image
curl -fsS http://127.0.0.1:3000/health
curl -fsS http://127.0.0.1:3001/health
curl -fsS http://127.0.0.1:3002/health || true
curl -I http://127.0.0.1/
```

Check the admin page:

- DB, Redis, realtime, AI, and image health are visible.
- Queue depth and failed job counts are visible.
- Degraded AI/image state is explicit if fallbacks are active.
- No open blocker reports remain.

## Backup

Create a backup before release:

```bash
scripts/backup-host-native.sh
```

Verify backup/restore tooling:

```bash
pnpm test:backup-restore
```

Record the backup directory in release notes.

## Rollback

Rollback code:

```bash
git log --oneline -5
git checkout <known-good-commit>
pnpm install --frozen-lockfile
pnpm prisma:generate
pnpm build
sudo systemctl restart meme-foundry-web meme-foundry-realtime meme-foundry-ai-service meme-foundry-worker-ai-text meme-foundry-worker-image
```

Rollback database only if the migration is confirmed incompatible and the
release cannot be fixed forward:

```bash
scripts/restore-host-native.sh backups/YYYYMMDD-HHMMSS
sudo systemctl restart meme-foundry-web meme-foundry-realtime meme-foundry-ai-service meme-foundry-worker-ai-text meme-foundry-worker-image
```

After rollback:

```bash
curl -fsS http://127.0.0.1:3000/health
pnpm test:browser-audit
pnpm test:a11y
```

## Soak And Scale Evidence

Before declaring host-native share-ready:

- Run `pnpm test:release`.
- Run `pnpm test:e2e`.
- Run browser-use visual and playtest audits.
- Run stress/scale while the browser remains usable.
- Run a 30-minute host-native soak and record service logs, health, queue
  counts, and browser-use checks during the soak:

```bash
SOAK_MINUTES=30 SOAK_INTERVAL_SECONDS=60 pnpm test:soak
```

## Final Release Checklist

- Working tree clean.
- Latest commit pushed.
- Backup created and restore smoke passed.
- Release gate passed.
- E2E passed.
- Browser-use audits/playtests recorded.
- Security audit passed or mitigations documented.
- Admin health page clean or degraded states intentionally documented.
- Runbook, evidence, and release notes committed.
