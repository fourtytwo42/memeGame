# Stage 13 Local Image Pipeline

Stage 13 adds a host-native local image worker and token card pipeline. The
first backend is deterministic CPU-local SVG/Sharp generation so the app has a
production-safe local path now, while the worker remains backend-neutral for a
future FastSD/SDXL runtime.

## What Was Added

- `packages/image-pipeline`
  - mascot prompt builder;
  - negative prompt builder;
  - deterministic local mascot renderer;
  - square token card, wide token card, and share card compositor;
  - alpha coverage helper for transparent asset validation.
- `apps/worker-image`
  - BullMQ queue contract;
  - one-at-a-time generation;
  - disk-space guard;
  - queued/generating/ready/retrying/failed lifecycle;
  - token image URL update;
  - realtime `TOKEN_IMAGE_READY` broadcast.
- Launch creation now records an `ImageJob` immediately while keeping the
  polished placeholder card.
- Admin shows recent image jobs and failure/retry state.
- `pnpm test:image-burst` creates and processes at least 25 image jobs.

## Runtime Notes

```bash
pnpm --filter @meme-foundry/worker-image dev
```

Generated runtime files:

```txt
data/images/{tokenId}/v{version}/mascot_raw.png
apps/web/public/generated/tokens/{tokenId}/v{version}/token_card_square.png
apps/web/public/generated/tokens/{tokenId}/v{version}/token_card_wide.png
apps/web/public/generated/tokens/{tokenId}/v{version}/share_card_wide.png
```

The generated card text is app-rendered in SVG/Sharp. The image backend only
creates mascot art and card composition; it does not ask an image model to
render ticker/name text.

## Verification

Stage 13 gates:

```bash
pnpm verify
pnpm test:image-burst
pnpm world:refresh && pnpm test:e2e
REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 IMAGE_BURST_JOBS=25 pnpm test:release
pnpm audit --audit-level high
```

## Verification Evidence

Completed on the VM for Stage 13:

- `pnpm db:test:reset`
- `pnpm verify`
- `IMAGE_BURST_JOBS=25 pnpm test:image-burst`
- `pnpm world:refresh && pnpm test:e2e`
- `REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 IMAGE_BURST_JOBS=25 pnpm test:release`
- `pnpm audit --audit-level high`

Observed results:

- Unit/integration suite: 45 Vitest tests passed.
- Playwright E2E: 28 tests passed after rerunning without concurrent release
  load. The earlier parallel run had one mobile crew navigation timeout while
  release stress gates were also running.
- Release gate included realtime 100-client load, support burst, crew scale,
  local AI smoke, 100 text-AI jobs, and 25 image jobs.
- Browser-use confirmed:
  - public token page loads a generated local image URL;
  - admin image jobs show ready jobs;
  - admin image jobs show retry/error state after a forced local failure.
- Audit still reports two moderate advisories, but the high-severity gate
  passes.
