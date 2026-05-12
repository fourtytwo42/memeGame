# Stage 16 Docker Completion Audit

Date: 2026-05-12

Stage 16 packages the already accepted host-native release candidate into a
Docker Compose deployment. Docker remains the final packaging target; it was
not used as a shortcut before host-native completion.

## Packaging Artifacts

- `Dockerfile` builds the monorepo on `node:22-bookworm-slim`, installs
  OpenSSL for Prisma, generates Prisma Client, and runs the production build.
- `docker-compose.yml` runs Postgres 17, Redis 8, web, realtime, AI service,
  AI text worker, image worker, and Nginx.
- `deploy/nginx/meme-foundry.docker.conf` proxies web and Socket.IO traffic and
  preserves `Host` / `X-Forwarded-Host` including `:8080`.
- `.env.docker.example` documents local-only defaults with no external AI or
  image APIs.
- `.dockerignore` excludes local secrets, generated runtime data, PRD, memory,
  and agent files.
- `docs/DOCKER_DEPLOYMENT.md` documents build, run, health checks, Docker
  verification env, persistent volumes, and Docker backup/restore verification.

## Runtime Topology

Compose service health after startup:

- `postgres`: healthy, VM-local port `127.0.0.1:55432`
- `redis`: healthy, VM-local port `127.0.0.1:56379`
- `web`: healthy
- `realtime`: healthy
- `ai-service`: healthy
- `worker-ai-text`: running
- `worker-image`: running
- `nginx`: healthy, public Docker entrypoint `http://localhost:8080`

`curl -fsS http://localhost:8080/health` returned HTTP 200.

## Verification Evidence

Docker build:

```bash
docker compose build
```

Result: all app images built successfully.

Docker startup:

```bash
docker compose up -d
docker compose ps
curl -fsS http://localhost:8080/health
```

Result: stack started; web logs show all five Prisma migrations applied and
seed completed.

Full Docker release suite:

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

Result: passed.

Coverage from the green release run:

- TypeScript, lint, Prettier, Vitest, Prisma schema validation, production
  build.
- Production asset manifest verification: 32 assets across 8 categories.
- Browser audit: 11 major routes.
- Responsive visual audit: 11 routes x 3 viewports, including left-rail
  navigation contract.
- Accessibility audit: 11 routes, 0 issues.
- Stress and scale checks.
- Realtime load: 100 clients connected/subscribed/ticked.
- Support burst: 20 clients fulfilled with expected duplicate protection.
- Crew scale: 25 crews, 25 featured launches, 4 members per crew.
- Local-only AI smoke and burst checks.
- Local image generation burst: 25 ready jobs, 0 failed.
- Docker backup/restore smoke: dump and restore succeeded using Postgres 17
  tools inside the Docker `postgres` service.

Security audit:

```bash
pnpm audit --audit-level moderate
```

Result: no known vulnerabilities found.

## Acceptance

Stage 16 is accepted. Docker packaging, Docker runbook, Docker health checks,
Docker backup/restore, and Docker release verification are complete.
