import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { prisma } from "../packages/db/src/index";

type ManifestAsset = {
  id: string;
  category: string;
  sourcePrompt: string | null;
  sourceImagePath: string | null;
  finalAssetPath: string;
  keyColor: string | null;
  backgroundRemovalMethod: string;
  dimensions: { width: number; height: number };
  format: string;
  usage: string;
  altText: string;
  status: string;
  reviewNotes: string;
  createdAt: string;
  updatedAt: string;
};

const root = process.cwd();
const today = "2026-05-13";

const tokenVariants = [
  [
    "frog",
    "Frog Meta",
    "apps/web/public/assets/game/narratives/frogs.png",
    "#a3ff12"
  ],
  [
    "dog",
    "Dog Season",
    "apps/web/public/assets/game/narratives/dogs.png",
    "#ffcf33"
  ],
  [
    "ai",
    "AI Agents",
    "apps/web/public/assets/game/narratives/ai-agents.png",
    "#20f7ff"
  ],
  [
    "wizard",
    "Wizard Cartel",
    "apps/web/public/assets/game/narratives/wizard.png",
    "#b45cff"
  ],
  [
    "snack",
    "Snack Finance",
    "apps/web/public/assets/game/narratives/food.png",
    "#ff9f1c"
  ],
  [
    "retro",
    "Retro Internet",
    "apps/web/public/assets/game/narratives/retro-internet.png",
    "#ff4fd8"
  ],
  [
    "cozy",
    "Cozy Chaos",
    "apps/web/public/assets/game/narratives/community.png",
    "#5df2a6"
  ],
  [
    "space",
    "Space Pets",
    "apps/web/public/assets/game/narratives/robots.png",
    "#65a8ff"
  ],
  [
    "cat",
    "Cat Domination",
    "apps/web/public/assets/game/narratives/cats.png",
    "#ff5fb7"
  ],
  [
    "cult",
    "Cult Community",
    "apps/web/public/assets/game/narratives/community.png",
    "#9cff4a"
  ],
  [
    "robot",
    "Robot Revival",
    "apps/web/public/assets/game/narratives/robots.png",
    "#30f0ff"
  ],
  [
    "absurd",
    "Absurdist Internet",
    "apps/web/public/assets/game/narratives/absurdist.png",
    "#f97316"
  ]
] as const;

const crewVariants = [
  ["frog-foundry", "#a3ff12"],
  ["purple-forge", "#bd5cff"],
  ["meme-lordz", "#ff4fd8"],
  ["pixel-pioneers", "#20f7ff"],
  ["chaos-crew", "#ffcf33"],
  ["signal-cartel", "#5df2a6"]
] as const;

function publicPath(assetPath: string) {
  return assetPath.replace("apps/web/public", "");
}

function escapeText(value: string) {
  return value.replace(/[&<>"]/g, (char) => {
    if (char === "&") return "&amp;";
    if (char === "<") return "&lt;";
    if (char === ">") return "&gt;";
    return "&quot;";
  });
}

function variantSvg({
  accent,
  label,
  kind
}: {
  accent: string;
  label: string;
  kind: "token" | "crew" | "badge";
}) {
  const safeLabel = escapeText(label.toUpperCase());
  return Buffer.from(`
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="g" cx="50%" cy="42%" r="58%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="0.50"/>
      <stop offset="52%" stop-color="${accent}" stop-opacity="0.20"/>
      <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
    </radialGradient>
    <filter id="blur"><feGaussianBlur stdDeviation="10"/></filter>
  </defs>
  <circle cx="256" cy="246" r="220" fill="url(#g)"/>
  <circle cx="256" cy="246" r="172" fill="#07111f" fill-opacity="0.82" stroke="${accent}" stroke-width="8"/>
  <circle cx="256" cy="246" r="196" fill="none" stroke="${accent}" stroke-opacity="0.25" stroke-width="5" stroke-dasharray="18 14"/>
  <path d="M105 362 C158 405 354 405 407 362" fill="none" stroke="${accent}" stroke-width="14" stroke-linecap="round" opacity="0.65"/>
  <text x="256" y="448" text-anchor="middle" font-family="Arial Black, Impact, sans-serif" font-size="${kind === "badge" ? 36 : 42}" fill="white" stroke="#020617" stroke-width="8" paint-order="stroke">${safeLabel}</text>
</svg>`);
}

async function composeTokenVariant(
  id: string,
  narrative: string,
  source: string,
  accent: string
) {
  const output = `apps/web/public/assets/game/tokens/${id}-token-card.png`;
  await mkdir(path.dirname(path.join(root, output)), { recursive: true });
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      { input: variantSvg({ accent, label: id, kind: "token" }) },
      {
        input: await sharp(path.join(root, source))
          .resize(270, 270, { fit: "contain" })
          .modulate({ saturation: 1.15, brightness: 1.05 })
          .png()
          .toBuffer(),
        left: 121,
        top: 86
      }
    ])
    .png()
    .toFile(path.join(root, output));

  return {
    id: `prd-token-${id}`,
    category: "game/tokens",
    sourcePrompt:
      "Composed project-local token card variant using existing imagegen narrative sticker art, neon HUD frame, and transparent alpha canvas.",
    sourceImagePath: "assets/source/imagegen/narrative-categories-sheet.png",
    finalAssetPath: output,
    keyColor: "#ff00ff",
    backgroundRemovalMethod:
      "local sharp composition from existing imagegen alpha assets",
    dimensions: { width: 512, height: 512 },
    format: "png",
    usage: `Distinct token card art for ${narrative} launches and leaderboard rows.`,
    altText: `${narrative} token card art.`,
    status: "ready",
    reviewNotes:
      "Composed from imagegen-produced narrative art to reduce repeated default token placeholders.",
    createdAt: today,
    updatedAt: today
  } satisfies ManifestAsset;
}

async function composeCrewVariant(id: string, accent: string) {
  const output = `apps/web/public/assets/game/crews/${id}-crew-avatar.png`;
  await mkdir(path.dirname(path.join(root, output)), { recursive: true });
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: variantSvg({
          accent,
          label: id.replace(/-/g, " "),
          kind: "crew"
        })
      },
      {
        input: await sharp(
          path.join(
            root,
            "apps/web/public/assets/game/crews/default-avatar.png"
          )
        )
          .resize(250, 250, { fit: "contain" })
          .modulate({ saturation: 1.2, brightness: 1.04 })
          .png()
          .toBuffer(),
        left: 131,
        top: 95
      }
    ])
    .png()
    .toFile(path.join(root, output));

  return {
    id: `prd-crew-${id}`,
    category: "game/crews",
    sourcePrompt:
      "Composed project-local crew avatar variant using existing imagegen crew art, neon HUD frame, and transparent alpha canvas.",
    sourceImagePath: "assets/source/imagegen/npc-crew-ui-sheet.png",
    finalAssetPath: output,
    keyColor: "#00ff00",
    backgroundRemovalMethod:
      "local sharp composition from existing imagegen alpha assets",
    dimensions: { width: 512, height: 512 },
    format: "png",
    usage: `Distinct crew avatar art for ${id.replace(/-/g, " ")} surfaces.`,
    altText: `${id.replace(/-/g, " ")} crew avatar art.`,
    status: "ready",
    reviewNotes:
      "Composed from imagegen-produced crew art to reduce repeated default crew placeholders.",
    createdAt: today,
    updatedAt: today
  } satisfies ManifestAsset;
}

async function composeBadgeVariant(id: string, source: string, accent: string) {
  const output = `apps/web/public/assets/game/crews/${id}-badge.png`;
  await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([
      {
        input: variantSvg({
          accent,
          label: id.replace(/-/g, " "),
          kind: "badge"
        })
      },
      {
        input: await sharp(path.join(root, source))
          .resize(220, 220, { fit: "contain" })
          .png()
          .toBuffer(),
        left: 146,
        top: 95
      }
    ])
    .png()
    .toFile(path.join(root, output));

  return {
    id: `prd-badge-${id}`,
    category: "game/crews",
    sourcePrompt:
      "Composed project-local crew badge variant using existing imagegen status art, neon HUD frame, and transparent alpha canvas.",
    sourceImagePath: "assets/source/imagegen/status-emotions-sheet.png",
    finalAssetPath: output,
    keyColor: "#00ff00",
    backgroundRemovalMethod:
      "local sharp composition from existing imagegen alpha assets",
    dimensions: { width: 512, height: 512 },
    format: "png",
    usage: `Distinct crew badge and reward art for ${id.replace(/-/g, " ")} surfaces.`,
    altText: `${id.replace(/-/g, " ")} crew badge art.`,
    status: "ready",
    reviewNotes:
      "Composed from imagegen-produced status art to add reward/badge variety.",
    createdAt: today,
    updatedAt: today
  } satisfies ManifestAsset;
}

async function updateManifest(newAssets: ManifestAsset[]) {
  const manifestPath = path.join(root, "assets/manifest/assets.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  const existing = manifest.assets as ManifestAsset[];
  const newIds = new Set(newAssets.map((asset) => asset.id));
  manifest.assets = [
    ...existing.filter((asset) => !newIds.has(asset.id)),
    ...newAssets
  ].sort((a, b) => a.id.localeCompare(b.id));
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

async function updateDemoRows() {
  const tokens = await prisma.launchToken.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });
  for (const token of tokens) {
    const key = tokenVariants.find(([, narrative]) =>
      token.narrative
        .toLowerCase()
        .includes(narrative.toLowerCase().split(" ")[0])
    );
    const fallback = tokenVariants[token.name.length % tokenVariants.length];
    const [id] = key ?? fallback;
    await prisma.launchToken.update({
      where: { id: token.id },
      data: {
        cardImageUrl: publicPath(
          `apps/web/public/assets/game/tokens/${id}-token-card.png`
        )
      }
    });
  }

  const crews = await prisma.crew.findMany({
    orderBy: [{ score: "desc" }, { createdAt: "asc" }]
  });
  for (const [index, crew] of crews.entries()) {
    const [id] = crewVariants[index % crewVariants.length];
    await prisma.crew.update({
      where: { id: crew.id },
      data: {
        avatarUrl: publicPath(
          `apps/web/public/assets/game/crews/${id}-crew-avatar.png`
        )
      }
    });
  }

  return { tokens: tokens.length, crews: crews.length };
}

async function main() {
  const tokenAssets = await Promise.all(
    tokenVariants.map(([id, narrative, source, accent]) =>
      composeTokenVariant(id, narrative, source, accent)
    )
  );
  const crewAssets = await Promise.all(
    crewVariants.map(([id, accent]) => composeCrewVariant(id, accent))
  );
  const badgeAssets = await Promise.all([
    composeBadgeVariant(
      "top-rank",
      "apps/web/public/assets/game/status/graduated.png",
      "#ffcf33"
    ),
    composeBadgeVariant(
      "raid-ready",
      "apps/web/public/assets/game/status/hot.png",
      "#ff4fd8"
    ),
    composeBadgeVariant(
      "fud-shield",
      "apps/web/public/assets/game/status/revived.png",
      "#5df2a6"
    ),
    composeBadgeVariant(
      "lore-spread",
      "apps/web/public/assets/game/status/cooling.png",
      "#20f7ff"
    )
  ]);

  await updateManifest([...tokenAssets, ...crewAssets, ...badgeAssets]);
  const updatedRows = await updateDemoRows();

  console.log(
    JSON.stringify(
      {
        composedAssets:
          tokenAssets.length + crewAssets.length + badgeAssets.length,
        updatedRows
      },
      null,
      2
    )
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => prisma.$disconnect());
