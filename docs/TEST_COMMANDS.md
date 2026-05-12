# Test and Verification Commands

Stage 2 wires the command surface that later stages must fill with production coverage.

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

`test:browser-audit` is a placeholder command until live browser-use audit scripts and notes are added with the first user-facing stages. The acceptance gate still requires using `browser-use:browser` against the running app.

`test:stress` and `test:scale` are wired placeholders in Stage 2 so later implementation can replace them without changing the release command contract.
