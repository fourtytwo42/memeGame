# Host-Native Deployment And Operations

Docker remains a later hardening stage. Until then, Meme Foundry runs directly
on the VM with systemd-managed Node processes, local Postgres, local Redis,
local AI, and local image generation.

## Services

```txt
web: pnpm --filter @meme-foundry/web start
realtime: pnpm --filter @meme-foundry/realtime-app start
ai-service: pnpm --filter @meme-foundry/ai-service start
worker-ai-text: pnpm --filter @meme-foundry/worker-ai-text start
worker-image: pnpm --filter @meme-foundry/worker-image start
postgresql
redis-server
ollama/local-llm
nginx
```

Bind public traffic through Nginx:

```txt
/ -> 127.0.0.1:3000
/socket.io -> 127.0.0.1:3001
```

Templates live in:

```txt
deploy/systemd/
deploy/nginx/meme-foundry.conf
```

Install service templates:

```bash
sudo cp deploy/systemd/*.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now meme-foundry-web meme-foundry-realtime
sudo systemctl enable --now meme-foundry-ai-service
sudo systemctl enable --now meme-foundry-worker-ai-text meme-foundry-worker-image
```

Install Nginx template:

```bash
sudo cp deploy/nginx/meme-foundry.conf /etc/nginx/sites-available/meme-foundry.conf
sudo ln -sf /etc/nginx/sites-available/meme-foundry.conf /etc/nginx/sites-enabled/meme-foundry.conf
sudo nginx -t
sudo systemctl reload nginx
```

Keep Postgres, Redis, the local LLM endpoint, and worker ports off the public
internet. Only Nginx should expose HTTP/S.

## Backups

Create a backup:

```bash
scripts/backup-host-native.sh
```

Restore from a backup directory:

```bash
scripts/restore-host-native.sh backups/YYYYMMDD-HHMMSS
```

Smoke test backup and restore tooling:

```bash
pnpm test:backup-restore
```

## Admin Operations

The `/admin` page shows:

- database, Redis, AI, and image backend health;
- active sessions, socket client pressure, queue depth, worker lag, and
  queue/failure counts;
- open reports and moderation actions;
- season and narrative editors;
- recent AI logs and image jobs;
- recent admin action audit entries.

Admin actions are logged in `AdminAction`.
