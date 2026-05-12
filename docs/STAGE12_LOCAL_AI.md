# Stage 12 Local Text AI

Stage 12 adds local-only text AI surfaces without making AI authoritative for
game state.

## What Was Added

- `packages/prompts` now owns AI schemas, effect allowlists, validation,
  unsafe-text rejection, prompt builders, and deterministic fallbacks.
- `apps/ai-service` exposes internal local-only endpoints:
  - `GET /health`
  - `POST /ai/generate-event`
  - `POST /ai/generate-npc-posts`
  - `POST /ai/founder-coach`
  - `POST /ai/season-commentary`
- `apps/worker-ai-text` owns the BullMQ queue contract and direct job
  processor for token events, NPC posts, and season commentary.
- `/launch/[id]/manage` shows a Founder Coach panel with local AI/template
  status and plain-language next steps.
- `/admin` shows recent `AiGeneratedContent` rows for model/template status,
  model name, timestamps, and errors.
- `scripts/ai-local-smoke.ts` verifies local endpoint guarding and fallback
  generation.
- `scripts/ai-text-burst.ts` processes at least 100 text-AI jobs in fallback
  mode to prove failure handling and worker throughput.

## Safety Rules

- Default target model remains `google/gemma-4-e2b`.
- External AI/image APIs are not used.
- The AI service refuses non-local inference URLs.
- AI output can propose effects, but the text worker only stores events/logs.
  It does not mutate token stats, market state, scores, energy, treasury,
  leaderboards, users, crews, or seasons.
- Bad JSON, unsafe text, unavailable service, disabled AI, or non-local config
  all fall back to deterministic templates.

## Runtime Notes

Host-native commands:

```bash
pnpm --filter @meme-foundry/ai-service dev
pnpm --filter @meme-foundry/worker-ai-text dev
```

Important environment:

```txt
AI_TEXT_ENABLED=false
AI_TEXT_DISABLED=false
LOCAL_LLM_BASE_URL=http://127.0.0.1:1234/v1
LOCAL_LLM_MODEL=google/gemma-4-e2b
AI_SERVICE_URL=http://127.0.0.1:3002
AI_TEXT_CONCURRENCY=1
AI_TEXT_TIMEOUT_MS=25000
```

`AI_TEXT_ENABLED=true` only allows calls when `LOCAL_LLM_BASE_URL` is local or
private VM-local infrastructure. Otherwise the service records a blocked
fallback.

## Verification

Stage 12 gates:

```bash
pnpm db:test:reset
pnpm verify
pnpm test:ai-smoke
AI_TEXT_BURST_JOBS=100 pnpm test:ai-text-burst
pnpm world:refresh && pnpm test:e2e
REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 pnpm test:release
pnpm audit --audit-level high
```

Browser-use audits should cover:

- Founder Coach visible on the active token dashboard.
- AI unavailable/template status does not block gameplay.
- Admin AI logs visible after worker/script activity.
- Leaderboard/realtime pages stay responsive after the burst test.

## Verification Evidence

Completed on the VM for Stage 12:

- `pnpm db:test:reset`
- `pnpm verify`
- `pnpm test:ai-smoke`
- `AI_TEXT_BURST_JOBS=100 pnpm test:ai-text-burst`
- `pnpm world:refresh && pnpm test:e2e`
- `REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 pnpm test:release`
- `pnpm audit --audit-level high`

Observed results:

- Unit/integration suite: 41 Vitest tests passed.
- Playwright E2E: 28 tests passed.
- Release gate included realtime 100-client load, support burst, crew scale,
  local AI smoke, and 100 text-AI jobs with 100 fallbacks.
- Audit still reports two moderate advisories, but the high-severity gate
  passes.
- Browser-use confirmed:
  - Founder Coach safe-template mode on an active token dashboard.
  - Founder Coach mocked local-AI available mode with generated output.
  - Admin AI logs showing `mocked_model` and fallback rows.
