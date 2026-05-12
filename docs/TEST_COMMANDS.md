# Test and Verification Commands

Stage 2 wired the command surface. Stage 15 replaces the remaining placeholder
release gates with real browser, accessibility, and stress checks.

```bash
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:integration
pnpm test:e2e
pnpm test:workers
pnpm test:browser-audit
pnpm test:a11y
pnpm test:stress
pnpm test:scale
pnpm test:release
pnpm prisma:validate
pnpm audit
pnpm build
pnpm verify
```

`test:browser-audit` runs `scripts/stage15-browser-audit.ts`. It starts or
reuses the VM web server, signs in through the real UI, resolves live dynamic
routes from Prisma, verifies the PRD route set, confirms the left-side
navigation contract, and rejects banned real-trading/wallet language.

`test:a11y` runs `scripts/stage15-a11y.ts`. It checks the same route set for
basic release-blocking accessibility issues: main landmarks, primary
navigation, h1s, image alt text, named controls, and labeled form fields.

`test:stress` runs `scripts/stage15-stress.ts`. It creates deterministic
synthetic founders/supporters, runs concurrent launch actions and support
actions, refreshes narratives/leaderboards, and fails if the duration budget or
state-write evidence is missing.

Browser-use visual and playtest evidence is still required by the Stage 15
roadmap in addition to these repeatable automated gates.
