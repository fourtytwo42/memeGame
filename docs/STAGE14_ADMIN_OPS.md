# Stage 14 Admin, Moderation, Operations, And Backups

Stage 14 adds the host-native operations layer for Meme Foundry.

## Implemented

- Admin health panel for Postgres, Redis, realtime, AI service fallback mode,
  image backend health, sessions, socket clients, queue depth, and worker lag.
- Admin season editor and narrative editor.
- Reports queue with report resolution and target-hiding actions.
- Token, crew, and user moderation helpers.
- Image job visibility and retry action.
- AI log and image job log visibility.
- Admin action audit log.
- Public report server action for token, crew, and user targets.
- Host-native backup and restore scripts.
- Backup/restore smoke test.
- Host-native Nginx and systemd templates.
- Realtime health payload with socket client count.

## Verification

Commands run on the VM from `/home/hendo420/memeGame`:

```bash
pnpm db:test:reset
pnpm exec vitest run tests/integration/stage14-admin-ops.test.ts
pnpm test:backup-restore
pnpm verify
pnpm world:refresh && pnpm test:e2e
REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 IMAGE_BURST_JOBS=25 pnpm test:release
pnpm audit --audit-level high
```

Results:

- Stage 14 integration: 4 tests passed.
- Full Vitest suite: 49 tests passed.
- Full Playwright E2E: 28 tests passed across desktop and mobile projects.
- Release gate passed, including realtime load, support burst, crew scale,
  AI smoke/burst, image burst, and backup/restore smoke.
- High-severity audit gate passed; two moderate advisories remain for later
  hardening.
- Backup smoke created a schema dump, restored it into
  `meme_foundry_restore_smoke`, and dropped the restore database.

## Browser-Use Evidence

Browser-use was run against `http://192.168.50.209:3000/admin`.

Confirmed:

- Admin control room renders with the left rail.
- Health and scale panel renders with degraded state visibility.
- Season editor and narrative editor render.
- Reports queue renders and a seeded report can be resolved.
- AI logs, image job queue, and admin action log render.
- A freshly seeded failed image job exposes `Retry`; retry removes the seeded
  failure and records the admin action.

## Exposure Check

`ss -ltnp` confirmed:

- Postgres listens on `127.0.0.1:5432`.
- Redis listens on `127.0.0.1:6379` and `[::1]:6379`.
- Ollama listens on `127.0.0.1:11434`.
- The local AI service port was not publicly listening during the check.

The realtime dev service may listen on `0.0.0.0:3001` for current browser
testing. Host-native production templates route realtime through Nginx.
