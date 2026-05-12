# Asset Pipeline

Stage 4 establishes the asset pipeline contract. Production asset generation happens in later stages, but all generated game art must follow this layout and manifest format.

## Directories

Final app assets live under `apps/web/public/assets/`:

- `brand/`
- `game/narratives/`
- `game/tokens/`
- `game/status/`
- `game/npcs/`
- `game/crews/`
- `game/share/`
- `ui/empty-states/`

Imagegen sources and working files live under `assets/source/imagegen/`.

The tracked manifest is `assets/manifest/assets.json`.

## Chroma-Key Workflow

1. Generate project-owned raster art with imagegen on a perfectly flat chroma-key background.
2. Use `#00ff00` by default, or `#ff00ff` when green appears in the subject.
3. Remove the chroma key locally into alpha PNG/WebP.
4. Verify the asset on dark and light backgrounds.
5. Optimize final dimensions for the intended UI surface.
6. Record prompt, source path, final path, dimensions, usage, alt text, and review notes in the manifest.

## Prompt Requirements

Every transparent-asset prompt should include:

```txt
Perfectly flat solid chroma-key background. No shadows, gradients, texture, floor plane, reflections, or lighting variation in the background. Subject fully separated from the background with crisp edges and generous padding. Do not use the chroma-key color anywhere in the subject. No watermark. No text unless the asset explicitly requires text.
```

## Icon Rules

Use `lucide-react` for deterministic utility icons. Use imagegen for expressive game art, not tiny menu controls. Every icon-only control must have an accessible name and hover/focus/tap help.
