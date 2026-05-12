# Docker Deployment

Docker packaging is Stage 16 and comes after the host-native release candidate.
The Compose stack mirrors the host-native topology:

- `postgres`
- `redis`
- `web`
- `realtime`
- `ai-service`
- `worker-ai-text`
- `worker-image`
- `nginx`

The public Docker entrypoint is `http://localhost:8080`. Internal app services
stay on the Compose network.

## First Run

```bash
cp .env.docker.example .env.docker
openssl rand -base64 48
# Put the generated value into AUTH_SECRET and NEXTAUTH_SECRET.
docker compose build
docker compose up -d
docker compose ps
curl -fsS http://localhost:8080/health
```

`web` runs migrations and seed data on startup. The seed is idempotent for the
release fixtures.

## Verification

Use the Docker URL for release checks:

```bash
export DATABASE_URL=postgresql://meme:meme@127.0.0.1:55432/meme_foundry
export REDIS_URL=redis://127.0.0.1:56379
export PLAYWRIGHT_BASE_URL=http://localhost:8080
export REALTIME_URL=http://localhost:8080
export REALTIME_LOAD_TIMEOUT_MS=45000
export SUPPORT_BURST_CLIENTS=20
export AI_TEXT_BURST_JOBS=100
export IMAGE_BURST_JOBS=25
export BACKUP_SMOKE_DOCKER_SERVICE=postgres

pnpm test:browser-audit
pnpm test:visual-audit
pnpm test:a11y
pnpm test:stress
pnpm test:scale
pnpm test:realtime-load
pnpm test:support-burst
pnpm test:crew-scale
pnpm test:ai-smoke
pnpm test:ai-text-burst
pnpm test:image-burst
pnpm test:backup-restore
```

Or run the same checks as one release pass:

```bash
DATABASE_URL=postgresql://meme:meme@127.0.0.1:55432/meme_foundry \
REDIS_URL=redis://127.0.0.1:56379 \
PLAYWRIGHT_BASE_URL=http://localhost:8080 \
REALTIME_URL=http://localhost:8080 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
AI_TEXT_BURST_JOBS=100 \
IMAGE_BURST_JOBS=25 \
BACKUP_SMOKE_DOCKER_SERVICE=postgres \
pnpm test:release
```

Compose exposes Postgres on `127.0.0.1:55432` and Redis on
`127.0.0.1:56379` only for VM-local verification scripts. The database and
cache are not exposed on public interfaces.

Use `localhost:8080` for browser verification because `.env.docker` sets
`AUTH_URL` and `NEXTAUTH_URL` to that origin; using `127.0.0.1:8080` will sign
in and then redirect to `localhost:8080`.

`BACKUP_SMOKE_DOCKER_SERVICE=postgres` makes the backup/restore smoke test use
the PostgreSQL 17 client tools inside the Docker Postgres container. This avoids
host/client version drift while still writing the temporary dump file on the VM.

## Operations

```bash
docker compose logs -f web realtime ai-service worker-ai-text worker-image
docker compose restart web realtime ai-service worker-ai-text worker-image
docker compose down
```

Persistent volumes:

- `postgres-data`
- `redis-data`
- `generated-assets`
- `image-data`

## Local-Only AI And Image Behavior

The Docker default keeps `AI_TEXT_ENABLED=false`, so the AI service uses safe
local fallbacks and does not call external APIs. If host Ollama is available,
the service can reach it through `host.docker.internal:11434`; otherwise the
fallback path is the expected degraded mode.

The image worker uses the local procedural Sharp backend and writes generated
images to Docker volumes mounted at the same paths used by the web container.
