# Stage 6 Launch Flow Evidence

Stage 6 adds the first-time founder and token launch path on the host-native VM app.

## Implemented

- Founder profile creation at `/profile` with server-side validation and authenticated upsert.
- New-player `/play` state recommends creating a founder profile before launch.
- Authenticated `/launch/new` wizard for token basics, narrative, mascot prompt, strategy, risk, review, and live preview.
- Token launch server action creates a live simulated `LaunchToken`, assigns initial deterministic game stats, links active season/narrative, records the initial game event, updates founder launch count, and increments narrative active launches.
- Transparent placeholder token SVG is project-local and tracked in the asset manifest.
- Launch defaults select on focus so first-time users can quickly replace sample text without needing to manually clear it.
- Next dev origin allows the VM IP so browser and Playwright verification hydrate client components correctly.

## Verification

Automated gates run on the VM:

- `pnpm verify` passed.
- `pnpm test:e2e` passed: 16 browser tests across desktop Chromium and mobile Chrome.
- `pnpm test:release` passed with the current placeholder browser-audit, stress, and scale scripts wired.
- `pnpm audit --audit-level high` passed with two known moderate findings remaining for later hardening.

Browser-use evidence:

- In-app browser connected to `http://192.168.50.209:3000`.
- Rookie account was reset to no founder profile and used for first-time player flow.
- Browser-use confirmed the `/play` recommendation points a new player to profile setup.
- Browser-use created a profile, reached the launch wizard, confirmed live preview updates, submitted a launch, landed on `/play?launched=...`, and confirmed the first recommended gameplay action is visible in the DOM.

## Notes

The current browser-audit, stress, and scale npm scripts are still Stage 2 placeholders. They pass as release wiring, but full production-grade audits arrive in later roadmap stages.
