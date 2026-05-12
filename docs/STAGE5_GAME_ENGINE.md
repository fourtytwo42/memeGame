# Stage 5 Game Engine Core

Stage 5 implements deterministic, server-owned game simulation logic before complex UI wiring.

## PRD Sections Consulted

- `PRD/02_gameplay_core_loop.md`
- `PRD/07_data_model.md`
- `PRD/09_simulation_engine.md`
- `PRD/15_production_acceptance_criteria.md`

## Implemented Scope

`packages/game-engine` now owns the pure engine layer:

- stat ranges and normalization;
- server-side action catalog grouped by player intent;
- `applyAction` with server-owned effects and idempotency key helper;
- attention, sell pressure, momentum, price change, holder delta, hype decay, fatigue, and trust-risk formulas;
- deterministic seeded noise for repeatable tests;
- `simulateTokenTick`;
- graduation logic and graduation variants;
- failure logic for dead and rugged states;
- score calculation;
- narrative heat, saturation, fatigue, and active-launch updates;
- bulk simulation helper for scale testing.

The client never supplies stat effects. It can only request a server-known action id in later API stages.

## Verification

Commands run successfully:

- `pnpm --filter @meme-foundry/game-engine typecheck`
- `pnpm test -- tests/game-engine.test.ts`
- `pnpm verify`
- `pnpm test:e2e`
- `pnpm test:release`
- `pnpm audit --audit-level high`

Tests added in `tests/game-engine.test.ts` cover:

- every action catalog intent group;
- action application and clamping;
- PRD attention and sell-pressure formula weights;
- deterministic seeded simulation;
- bounds for hostile input values;
- graduation variants;
- dead and rugged failure states;
- score penalties;
- narrative meta updates;
- bulk simulation over 250 tokens x 12 ticks = 3,000 token ticks.

## Notes

- This stage is pure engine logic; database persistence, worker scheduling, and realtime broadcasts are later roadmap stages.
- Browser-use was not required for Stage 5 because no user-facing UI changed in this stage.
- `pnpm audit --audit-level high` passes and still reports two moderate dependency issues for hardening.

## End Gate Result

Stage 5 is complete. The game engine can simulate token lifecycle mechanics without UI, has deterministic bulk simulation evidence, keeps stats bounded, and centralizes stat mutation server-side through the action catalog.
