import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

export const imagePipelinePackageName = "@meme-foundry/image-pipeline";

export type ImagePromptInput = {
  tokenName: string;
  ticker: string;
  concept?: string | null;
  narrative?: string | null;
};

export type TokenCardInput = ImagePromptInput & {
  founder: string;
  season?: string | null;
  crew?: string | null;
  tokenId: string;
  version: number;
};

export type ImageSetPaths = {
  storageDir: string;
  publicDir: string;
  mascotRawPath: string;
  squareCardPath: string;
  wideCardPath: string;
  shareCardPath: string;
  squareUrl: string;
  wideUrl: string;
  shareUrl: string;
};

const palette = [
  ["#34d399", "#0f172a", "#f8fafc"],
  ["#fbbf24", "#111827", "#fff7ed"],
  ["#fb7185", "#111827", "#fff1f2"],
  ["#60a5fa", "#0f172a", "#eff6ff"],
  ["#a78bfa", "#111827", "#f5f3ff"]
] as const;

export function buildMascotPrompt(input: ImagePromptInput) {
  const concept = sanitizePromptPart(
    input.concept || input.narrative || input.tokenName
  );
  return [
    `cartoon memecoin mascot sticker of ${concept}`,
    "bold clean outline",
    "expressive face",
    "centered character",
    "vibrant colors",
    "simple background",
    "high contrast",
    "web game asset",
    "no text",
    "no watermark",
    "no logo",
    "no signature"
  ].join(", ");
}

export function buildNegativePrompt() {
  return [
    "text",
    "letters",
    "words",
    "watermark",
    "signature",
    "realistic photo",
    "blurry",
    "extra limbs",
    "distorted face",
    "low quality",
    "cluttered background"
  ].join(", ");
}

export function imageStoragePaths({
  rootDir,
  publicRoot,
  tokenId,
  version
}: {
  rootDir: string;
  publicRoot: string;
  tokenId: string;
  version: number;
}): ImageSetPaths {
  const versionSlug = `v${version}`;
  const storageDir = path.join(rootDir, "data", "images", tokenId, versionSlug);
  const publicDir = path.join(
    publicRoot,
    "generated",
    "tokens",
    tokenId,
    versionSlug
  );
  const publicBase = `/generated/tokens/${tokenId}/${versionSlug}`;
  return {
    storageDir,
    publicDir,
    mascotRawPath: path.join(storageDir, "mascot_raw.png"),
    squareCardPath: path.join(publicDir, "token_card_square.png"),
    wideCardPath: path.join(publicDir, "token_card_wide.png"),
    shareCardPath: path.join(publicDir, "share_card_wide.png"),
    squareUrl: `${publicBase}/token_card_square.png`,
    wideUrl: `${publicBase}/token_card_wide.png`,
    shareUrl: `${publicBase}/share_card_wide.png`
  };
}

export async function generateProceduralMascot(input: TokenCardInput) {
  const [accent, dark, light] =
    palette[hashText(input.ticker) % palette.length];
  const initials = safeTicker(input.ticker).slice(0, 2);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="none"/>
  <circle cx="256" cy="256" r="194" fill="${accent}" opacity="0.18"/>
  <path d="M144 326c24 72 200 72 224 0 20-60-14-156-112-156s-132 96-112 156z" fill="${light}" stroke="${dark}" stroke-width="18" stroke-linejoin="round"/>
  <circle cx="202" cy="260" r="24" fill="${dark}"/>
  <circle cx="310" cy="260" r="24" fill="${dark}"/>
  <path d="M210 334c28 24 68 24 96 0" fill="none" stroke="${dark}" stroke-width="16" stroke-linecap="round"/>
  <path d="M132 190l46 30 18-58" fill="${accent}" stroke="${dark}" stroke-width="14" stroke-linejoin="round"/>
  <path d="M380 190l-46 30-18-58" fill="${accent}" stroke="${dark}" stroke-width="14" stroke-linejoin="round"/>
  <circle cx="256" cy="372" r="48" fill="${dark}"/>
  <text x="256" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="44" font-weight="900" fill="${light}">${escapeXml(initials)}</text>
</svg>`;
  return sharp(Buffer.from(svg)).png().toBuffer();
}

export async function createTokenImageSet({
  input,
  rootDir,
  publicRoot
}: {
  input: TokenCardInput;
  rootDir: string;
  publicRoot: string;
}) {
  const paths = imageStoragePaths({
    rootDir,
    publicRoot,
    tokenId: input.tokenId,
    version: input.version
  });
  await Promise.all([
    mkdir(paths.storageDir, { recursive: true }),
    mkdir(paths.publicDir, { recursive: true })
  ]);
  const mascot = await generateProceduralMascot(input);
  await sharp(mascot).png().toFile(paths.mascotRawPath);
  await Promise.all([
    renderCard({ input, mascot, width: 1024, height: 1024 }).then((buffer) =>
      sharp(buffer).png().toFile(paths.squareCardPath)
    ),
    renderCard({ input, mascot, width: 1280, height: 720 }).then((buffer) =>
      sharp(buffer).png().toFile(paths.wideCardPath)
    ),
    renderCard({ input, mascot, width: 1200, height: 630, share: true }).then(
      (buffer) => sharp(buffer).png().toFile(paths.shareCardPath)
    )
  ]);
  return paths;
}

export async function alphaCoverage(filePath: string) {
  const image = sharp(filePath).ensureAlpha();
  const { data, info } = await image
    .raw()
    .toBuffer({ resolveWithObject: true });
  let transparent = 0;
  let opaque = 0;
  for (let index = 3; index < data.length; index += info.channels) {
    if (data[index] === 0) transparent += 1;
    if (data[index] > 240) opaque += 1;
  }
  const pixels = info.width * info.height;
  return {
    transparentRatio: transparent / pixels,
    opaqueRatio: opaque / pixels
  };
}

async function renderCard({
  input,
  mascot,
  width,
  height,
  share = false
}: {
  input: TokenCardInput;
  mascot: Buffer;
  width: number;
  height: number;
  share?: boolean;
}) {
  const [accent, dark, light] =
    palette[hashText(input.ticker) % palette.length];
  const mascotSize = Math.round(
    Math.min(width, height) * (share ? 0.48 : 0.54)
  );
  const mascotLeft = share ? 64 : Math.round((width - mascotSize) / 2);
  const mascotTop = share
    ? Math.round((height - mascotSize) / 2)
    : Math.round(height * 0.08);
  const titleX = share ? Math.round(width * 0.52) : Math.round(width / 2);
  const titleAnchor = share ? "start" : "middle";
  const titleY = share ? Math.round(height * 0.34) : Math.round(height * 0.72);
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${accent}"/>
      <stop offset="45%" stop-color="#111827"/>
      <stop offset="100%" stop-color="${dark}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="42" fill="url(#bg)"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" rx="32" fill="none" stroke="rgba(255,255,255,0.22)" stroke-width="4"/>
  <circle cx="${width - 110}" cy="108" r="64" fill="rgba(255,255,255,0.10)"/>
  <text x="${titleX}" y="${titleY}" text-anchor="${titleAnchor}" font-family="Arial, sans-serif" font-size="${share ? 78 : 82}" font-weight="900" fill="${light}">${escapeXml(input.tokenName)}</text>
  <text x="${titleX}" y="${titleY + 72}" text-anchor="${titleAnchor}" font-family="Arial, sans-serif" font-size="${share ? 42 : 46}" font-weight="900" fill="${accent}">$${escapeXml(safeTicker(input.ticker))}</text>
  <text x="${titleX}" y="${titleY + 126}" text-anchor="${titleAnchor}" font-family="Arial, sans-serif" font-size="${share ? 28 : 30}" font-weight="700" fill="rgba(255,255,255,0.74)">${escapeXml(input.narrative ?? "Meme Foundry")} / ${escapeXml(input.founder)}</text>
  <text x="${width - 54}" y="${height - 48}" text-anchor="end" font-family="Arial, sans-serif" font-size="24" font-weight="900" fill="rgba(255,255,255,0.56)">SIMULATED - NO REAL TRADING</text>
</svg>`;
  return sharp(Buffer.from(svg))
    .composite([
      {
        input: await sharp(mascot)
          .resize(mascotSize, mascotSize)
          .png()
          .toBuffer(),
        left: mascotLeft,
        top: mascotTop
      }
    ])
    .png()
    .toBuffer();
}

function safeTicker(value: string) {
  return (
    value
      .replace(/[^a-z0-9]/gi, "")
      .toUpperCase()
      .slice(0, 10) || "MEME"
  );
}

function sanitizePromptPart(value: string) {
  return value
    .replace(/[^a-z0-9\s-]/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function hashText(value: string) {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}
