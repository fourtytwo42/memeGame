# PRD Screen Alignment Stage 2 Shell And Admin HUD

Date: 2026-05-13
Target: `http://192.168.50.209`
Roadmap: `PRD_SCREEN_ALIGNMENT_ROADMAP.md`

## Objective

Tighten the global shell and introduce an admin-specific shell mode so the
admin surfaces no longer feel like player pages with operations widgets dropped
underneath.

## Implementation

Updated `apps/web/src/components/shell/app-shell.tsx`:

- Added `variant?: "player" | "admin"`.
- Player pages keep the existing left rail, active season card, active launch
  affordance, and no-real-trading resource strip.
- Admin pages use an admin nav set:
  - Dashboard
  - Seasons
  - Narratives
  - Reports
  - AI logs
  - Images
  - Assets
- Admin shell shows an admin console card, host-native VM status, live ops
  status, and an admin resource strip with runtime/window/refresh context.
- Admin shell removes the player active-launch affordance and player fake-budget
  strip from admin first viewport.

Updated admin routes:

- `apps/web/src/app/admin/page.tsx` now uses `<AppShell variant="admin">`.
- `apps/web/src/app/admin/assets/page.tsx` now uses
  `<AppShell variant="admin">`.
- Admin page sections have anchor IDs for the admin nav.

## Browser-Use Verification

Browser-use checked `/play`, `/admin`, and `/admin/assets` after restarting the
host-native web service.

Observed:

- `/play` still shows `Season 7: Memeverse Rising`, `Manage PUNK45`, and
  `No real trading`.
- `/play` does not show admin shell text like `Admin console` or
  `Host-native VM`.
- `/admin` shows `Admin console`, `Host-native VM`, `Dashboard`,
  `Narratives`, `Runtime`, and `Admin control room`.
- `/admin` does not show `Manage PUNK45` or `Fake budget`.
- `/admin/assets` shows the admin shell and `Asset Gallery`.
- Console errors: 0 on checked routes.

## Verification Commands

```bash
pnpm --filter @meme-foundry/web typecheck
pnpm --filter @meme-foundry/web build
echo 'Country1!' | sudo -S systemctl restart meme-foundry-web
PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:visual-audit
```

Result: passed.

## Stage 2 End Gate

Passed.

- Player screens keep the left rail and compact player HUD.
- Admin screens use an admin-specific shell and no longer expose player launch
  widgets in the first viewport.
- Mobile/tablet/desktop visual audit passed.
- Web typecheck and build passed.
