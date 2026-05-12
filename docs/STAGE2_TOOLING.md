# Stage 2 Tooling Foundation

Stage 2 establishes the host-native Next.js monorepo foundation for Meme Foundry. It is intentionally not Docker-first; Docker remains a later release-hardening target after the VM-hosted app is complete and tested.

## Workspace

- Package manager: `pnpm`
- Runtime: Node.js/TypeScript
- App package: `apps/web`
- Shared packages:
  - `packages/db`
  - `packages/game-engine`
  - `packages/image-pipeline`
  - `packages/prompts`
  - `packages/shared-types`
  - `packages/ui`
  - `packages/validation`
- Asset manifest path: `assets/manifest/assets.json`
- Generated image source staging path: `assets/source/imagegen/`

## Verification Commands

The following commands are wired into the root workspace:

- `pnpm verify`
- `pnpm test:e2e`
- `pnpm test:browser-audit`
- `pnpm test:stress`
- `pnpm test:scale`
- `pnpm test:release`
- `pnpm audit --audit-level high`

Stage 2 includes placeholder browser-audit, stress, and scale commands so the pipeline contract exists before the full implementations are built in later roadmap stages.

## Browser-Use Evidence

The in-app browser was used against the VM-hosted dev server at `http://192.168.50.209:3000/`.

Home route checks passed:

- `Meme Foundry` visible
- `Launch` action visible
- `Take recommended action` action visible
- `Growth`, `Belief`, `Community`, and `Risk` stats visible

Health route checks passed at `http://192.168.50.209:3000/health`:

- `Meme Foundry health` visible
- health status reports `ok`

Screenshot capture through browser-use timed out in this environment during Stage 2, so Stage 2 evidence uses DOM/accessibility checks. Later UI stages must keep screenshot-based visual audits as a release gate.

## Current Notes

- The dev server is reachable on the VM with `pnpm --filter @meme-foundry/web dev --hostname 0.0.0.0 --port 3000`.
- Playwright Chromium and Linux browser dependencies are installed on the VM.
- `pnpm audit --audit-level high` passes the high-severity gate but currently reports one moderate dependency issue. This is tracked as dependency-hardening debt for later stages.
