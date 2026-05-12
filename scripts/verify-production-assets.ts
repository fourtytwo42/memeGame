import { access, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

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
};

const root = process.cwd();
const requiredCategories = [
  "brand",
  "game/narratives",
  "game/tokens",
  "game/status",
  "game/npcs",
  "game/crews",
  "game/share",
  "ui/empty-states"
];

const minimumCounts: Record<string, number> = {
  brand: 1,
  "game/narratives": 10,
  "game/tokens": 3,
  "game/status": 8,
  "game/npcs": 4,
  "game/crews": 2,
  "game/share": 1,
  "ui/empty-states": 2
};

function assert(condition: unknown, message: string) {
  if (!condition) throw new Error(message);
}

async function verifyPng(asset: ManifestAsset) {
  const fullPath = path.join(root, asset.finalAssetPath);
  await access(fullPath);
  const image = sharp(fullPath);
  const metadata = await image.metadata();
  assert(
    metadata.width === asset.dimensions.width,
    `${asset.id} width mismatch`
  );
  assert(
    metadata.height === asset.dimensions.height,
    `${asset.id} height mismatch`
  );
  assert(metadata.hasAlpha, `${asset.id} is missing alpha channel`);

  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const corners = [
    3,
    (info.width - 1) * 4 + 3,
    (info.height - 1) * info.width * 4 + 3,
    ((info.height - 1) * info.width + info.width - 1) * 4 + 3
  ];
  const transparentCorners = corners.filter((index) => data[index] <= 2).length;
  assert(
    transparentCorners >= 3,
    `${asset.id} does not have transparent corners`
  );

  let opaquePixels = 0;
  let alphaPixels = 0;
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 0) alphaPixels++;
    if (data[i] > 220) opaquePixels++;
  }
  const totalPixels = info.width * info.height;
  const coverage = alphaPixels / totalPixels;
  assert(
    coverage > 0.02,
    `${asset.id} has too little visible subject coverage`
  );
  assert(coverage < 0.92, `${asset.id} background was not removed`);
  assert(opaquePixels > 200, `${asset.id} has no solid visible subject`);
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(root, "assets/manifest/assets.json"), "utf8")
  );
  const assets = manifest.assets as ManifestAsset[];
  const ids = new Set<string>();

  for (const asset of assets) {
    assert(asset.id, "asset missing id");
    assert(!ids.has(asset.id), `duplicate asset id ${asset.id}`);
    ids.add(asset.id);
    assert(asset.category, `${asset.id} missing category`);
    assert(asset.finalAssetPath, `${asset.id} missing finalAssetPath`);
    assert(asset.usage, `${asset.id} missing usage`);
    assert(asset.altText, `${asset.id} missing altText`);
    assert(asset.status === "ready", `${asset.id} is not ready`);
    assert(asset.reviewNotes, `${asset.id} missing reviewNotes`);
    const isRuntimePattern = asset.finalAssetPath.includes("{");
    if (asset.format === "png" && !isRuntimePattern) {
      assert(asset.sourcePrompt, `${asset.id} missing sourcePrompt`);
      assert(asset.sourceImagePath, `${asset.id} missing sourceImagePath`);
      assert(asset.keyColor, `${asset.id} missing keyColor`);
      await verifyPng(asset);
    } else if (!isRuntimePattern) {
      await access(path.join(root, asset.finalAssetPath));
    }
  }

  const byCategory = new Map<string, number>();
  for (const asset of assets) {
    byCategory.set(asset.category, (byCategory.get(asset.category) ?? 0) + 1);
  }
  for (const category of requiredCategories) {
    assert(byCategory.has(category), `missing category ${category}`);
    assert(
      (byCategory.get(category) ?? 0) >= minimumCounts[category],
      `${category} has ${byCategory.get(category) ?? 0} assets; expected at least ${minimumCounts[category]}`
    );
  }

  console.log(
    JSON.stringify(
      {
        assets: assets.length,
        categories: Object.fromEntries(byCategory),
        status: "production asset manifest verified"
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
