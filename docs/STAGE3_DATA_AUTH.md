# Stage 3 Data, Auth, And Seed Foundation

Stage 3 establishes Prisma/Postgres as the authoritative data layer and Auth.js credentials auth as the session foundation.

## PRD Sections Consulted

- `PRD/06_technical_architecture.md`
- `PRD/07_data_model.md`
- `PRD/12_security_safety_and_abuse.md`
- `PRD/15_production_acceptance_criteria.md`
- `PRD/18_production_scope.md`

## Implemented Scope

- Prisma 7 schema at `prisma/schema.prisma`.
- Initial migration at `prisma/migrations/20260512001657_stage3_data_auth/`.
- Auth.js/NextAuth credentials auth with username/email plus password.
- Password hashing via `bcryptjs` with seeded hashes.
- Auth.js adapter models: `Account`, `Session`, and `VerificationToken`.
- User role field with `user` and `admin` roles.
- Admin bootstrap through `ADMIN_EMAILS`.
- `/signin`, `/play`, `/admin`, `/api/auth/[...nextauth]`, and `/api/me`.
- Protected `/play` rejects anonymous users.
- `/admin` rejects anonymous users and non-admin users.
- Deterministic seed data:
  - active Genesis Season;
  - 8 narratives;
  - founder, supporter, crew, and admin users;
  - founder profiles;
  - crew and crew membership;
  - sample live, graduated, dead, rugged, image-queued, and image-failed tokens;
  - token ticks and support action data.
- Test database reset command: `pnpm db:test:reset`.
- Production-volume scale seed command: `pnpm db:seed:scale`.
- Scale seed defaults cover the roadmap target of 1,000 users, 2,500 tokens, 25 crews, 8 narratives, and 100,000 ticks/events-equivalent tick records.

Seeded verification password for local/dev accounts: `MemeFoundry!123`.

## Commands Verified

- `pnpm prisma generate`
- `pnpm prisma migrate dev --name stage3_data_auth`
- `pnpm db:seed`
- `pnpm db:test:reset`
- `DATABASE_URL=postgresql://meme:meme@localhost:5432/meme_foundry_test pnpm test:integration`
- `pnpm verify`
- `pnpm test:e2e`
- `pnpm db:seed:scale -- --dry-run`
- `pnpm test:release`
- `pnpm audit --audit-level high`

## Browser-Use Evidence

The in-app browser was used against `http://192.168.50.209:3000`.

Passed checks:

- Anonymous `/play` navigation lands on sign-in.
- Founder account can sign in through the visible sign-in form.
- Signed-in founder sees the sign-out control.
- Founder can sign out through the visible control.
- Admin account can sign in through the visible sign-in form.
- Admin can open `/admin` and see the admin count panel.

Browser-use note: the plugin's normal fill/type path hit clipboard limitations in this environment, so the final browser-use pass used DOM node clicks plus keypresses. `/api/me` is covered by Playwright and integration tests because browser-use did not expose the raw JSON snapshot consistently during the same pass.

## Security/Operations Notes

- Prisma 7 requires a Postgres driver adapter; `@prisma/adapter-pg` and `pg` are installed in `@meme-foundry/db`.
- The local `meme` Postgres role has `CREATEDB` so Prisma Migrate can create shadow databases during development.
- VM `.env` uses `AUTH_URL=http://192.168.50.209:3000` so browser-use from the desktop can complete auth redirects.
- `apps/web` scripts set `DOTENV_CONFIG_PATH=../../.env` so host-native web commands load the root VM env file.
- `pnpm audit --audit-level high` passes the high-severity gate and currently reports two moderate dependency issues for later hardening.
