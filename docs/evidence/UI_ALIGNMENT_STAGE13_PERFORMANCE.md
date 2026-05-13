# UI Alignment Stage 13 Performance, Realtime, And Load Evidence

Date: 2026-05-12
Target: `http://192.168.50.209`
Scope: `UI_ALIGNMENT_ROADMAP.md` Stage 13

## Objective

Verify that the richer UI alignment pass did not regress production readiness, realtime behavior, worker behavior, asset handling, or degraded-state clarity.

## Automated Regression Bundle

Command run on the VM from `/home/hendo420/memeGame`:

```bash
PLAYWRIGHT_BASE_URL=http://192.168.50.209 \
REALTIME_URL=http://192.168.50.209 \
REALTIME_LOAD_TIMEOUT_MS=45000 \
SUPPORT_BURST_CLIENTS=20 \
pnpm test:stress && pnpm test:scale && pnpm test:realtime-load && pnpm test:support-burst && pnpm assets:verify
```

Result: passed.

Observed output:

```json
{
  "stress": {
    "launchClients": 12,
    "supportClients": 24,
    "launchActions": 36,
    "supportActions": 24,
    "durationMs": 400,
    "ticks": 120,
    "events": 2066,
    "snapshots": 246
  },
  "scale": {
    "users": 215,
    "tokens": 82,
    "ticks": 853,
    "narratives": 8,
    "leaderboard": 50,
    "durationMs": 98
  },
  "realtimeLoad": {
    "clients": 100,
    "connected": 100,
    "subscribed": 100,
    "ticks": 100
  },
  "supportBurst": {
    "clients": 20,
    "fulfilled": 20,
    "duplicateFailures": 2,
    "durationMs": 241,
    "tokenId": "stage11-featured-token-24"
  },
  "assets": {
    "assets": 31,
    "status": "production asset manifest verified"
  }
}
```

Asset category coverage from `pnpm assets:verify`:

- `brand`: 1
- `game/crews`: 2
- `game/tokens`: 3
- `ui/empty-states`: 2
- `game/narratives`: 10
- `game/npcs`: 4
- `game/share`: 1
- `game/status`: 8

## Browser-Use Live Spot Check

Browser-use inspected live VM routes after the load suite.

### `/play`

- Left-rail navigation present.
- `No real trading` badge visible.
- Active launch summary visible for `Punkinu 45`.
- Market cap and market pulse visible.
- Recommended panel visible with `Manage active launch` and `Take action` path.
- Live metas, global events, leaderboard preview, and crew status visible.
- Console errors: 0.

### `/launch/cmp2nzjhx0000xdoai640jhgs/manage`

- Left-rail navigation present.
- `No real trading` badge visible.
- Manage header visible for `Punkinu 45`.
- Recommended move panel visible.
- Market cap movement panel visible.
- Grouped stats and action categories visible.
- Realtime status visible through `Live updates` copy.
- Console errors: 0.

### `/admin`

- Admin control room visible.
- Health and scale panel visible.
- Queue table visible.
- Image backend state visible.
- System alerts visible.
- Admin correctly reports image jobs as degraded when the queue has a failed baseline job. This is expected degraded-state visibility, not a UI regression.
- Console errors: 0.

## Stage 13 End Gate

Passed.

- Stress, scale, realtime load, support burst, and asset verification pass.
- Browser-use found no severe console errors on key player/admin routes.
- Admin degraded-state visibility remains clear after load.
- The visual alignment pass did not break production performance gates, realtime behavior, support/action traffic, asset verification, or worker/degraded health reporting.
