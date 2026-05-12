# Stage 4 UI System And App Shell

Stage 4 creates the durable UI foundation required before feature screens multiply.

## PRD Sections Consulted

- `PRD/11_ui_ux_spec.md`
- `PRD/17_screen_design_spec.md`
- `PRD/20_approachability_and_onboarding.md`
- `PRD/21_asset_production_and_iconography.md`
- `PRD/reference_screens/README.md`
- `PRD/18_production_scope.md`
- `PRD/19_testing_quality_browser_audit.md`

## Implemented Scope

### Shared UI Primitives

`@meme-foundry/ui` now provides:

- `Button`
- `Panel`
- `Badge`
- `StatBar`
- `Tabs`
- `ModalFrame`
- `FormField`
- `ToastMessage`
- `LoadingState`
- `EmptyState`
- `ErrorState`
- `DegradedState`

### Approachability Primitives

The web app now has:

- recommended action card;
- grouped stat summary;
- plain-language helps/risks display;
- stable `data-testid` hooks for audits;
- notification icon help with accessible name and hover/focus tooltip text.

### App Shell

The shell includes:

- desktop primary navigation;
- mobile bottom navigation;
- active season display;
- current auth/sign-out control;
- admin navigation for admin users;
- compact active-launch affordance;
- icon-only notification control with help text.

### Route Foundations

Stage 4 route foundations exist for:

- `/`
- `/play`
- `/launch/new`
- `/leaderboard`
- `/seasons`
- `/crews`
- `/profile`

Feature-complete behavior for these screens is still built in later roadmap stages.

### Asset Pipeline Foundations

Added:

- final asset folders under `apps/web/public/assets/`;
- source folder convention under `assets/source/imagegen/`;
- manifest schema and required fields in `assets/manifest/assets.json`;
- chroma-key workflow documentation in `docs/ASSET_PIPELINE.md`.

## Verification

Commands run successfully:

- `pnpm verify`
- `pnpm test:e2e`
- `pnpm test:release`
- `pnpm audit --audit-level high`

Automated coverage added:

- `tests/ui-primitives.test.tsx` checks important shared UI primitives and accessible roles.
- `e2e/shell.spec.ts` checks icon-only help and launch wizard shell controls on desktop and mobile Chromium.

Browser-use DOM audit passed for:

- home shell visibility;
- nonblank home command hub;
- `/play` obvious next action;
- grouped stats on `/play`;
- `/launch/new` wizard readability;
- route foundation readability.

Browser-use screenshot caveat:

- Browser-use screenshot capture still times out in this environment with `Page.captureScreenshot`.
- Desktop/mobile automated browser checks are covered by Playwright until the browser-use screenshot issue is resolved.
- This caveat must remain visible for later visual audit stages.

Audit caveat:

- `pnpm audit --audit-level high` passes the high-severity gate and reports two moderate dependency issues for hardening.

## End Gate Result

Stage 4 is complete enough to proceed to Stage 5. The shell, UI primitives, approachability primitives, asset pipeline foundations, tests, and browser-use DOM audit evidence are in place. Full feature behavior remains assigned to later roadmap stages.
