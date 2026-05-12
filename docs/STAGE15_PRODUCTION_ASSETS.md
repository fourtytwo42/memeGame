# Stage 15 Production Asset Pass

Stage 15 now has a project-owned production asset set generated from imagegen
source sheets and verified as release evidence.

## Asset Set

- Source sheets live in `assets/source/imagegen/`.
- Final project-local assets live under `apps/web/public/assets/`.
- Manifest: `assets/manifest/assets.json`.
- Admin visual QA route: `/admin/assets`.

Generated categories:

- `brand`: 1 asset.
- `game/narratives`: 10 assets.
- `game/tokens`: 4 assets, including the SVG fallback and raster/card-frame
  assets.
- `game/status`: 8 assets.
- `game/npcs`: 4 assets.
- `game/crews`: 2 assets.
- `game/share`: 1 asset.
- `ui/empty-states`: 2 assets.

## Verification

`pnpm assets:verify` checks:

- required category coverage and minimum counts;
- manifest required fields;
- final file existence;
- PNG dimensions;
- alpha channel presence;
- transparent corners;
- visible subject coverage;
- non-empty opaque subject pixels.

Latest verified command:

```bash
REALTIME_LOAD_TIMEOUT_MS=45000 SUPPORT_BURST_CLIENTS=20 AI_TEXT_BURST_JOBS=100 IMAGE_BURST_JOBS=25 PLAYWRIGHT_BASE_URL=http://192.168.50.209 pnpm test:release
```

Observed asset verifier result:

```json
{
  "assets": 32,
  "categories": {
    "brand": 1,
    "game/crews": 2,
    "game/tokens": 4,
    "ui/empty-states": 2,
    "game/narratives": 10,
    "game/npcs": 4,
    "game/share": 1,
    "game/status": 8
  },
  "status": "production asset manifest verified"
}
```

Browser-use opened `/admin/assets` against the live VM and visually confirmed
the generated assets render on checkerboard backgrounds with the left-rail app
shell.
