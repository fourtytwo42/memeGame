import Image from "next/image";
import { redirect } from "next/navigation";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { Badge, Panel } from "@meme-foundry/ui";

export const dynamic = "force-dynamic";

type ManifestAsset = {
  id: string;
  category: string;
  finalAssetPath: string;
  dimensions: { width: number; height: number };
  format: string;
  usage: string;
  altText: string;
  status: string;
};

async function loadAssets() {
  const manifestPath = path.join(
    process.cwd(),
    "../../assets/manifest/assets.json"
  );
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  return (manifest.assets as ManifestAsset[]).filter(
    (asset) =>
      asset.status === "ready" &&
      asset.format !== "svg" &&
      !asset.finalAssetPath.includes("{")
  );
}

function publicPath(assetPath: string) {
  return assetPath.replace("apps/web/public", "");
}

export default async function AdminAssetsPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/play");

  const assets = await loadAssets();
  const categories = Array.from(new Set(assets.map((asset) => asset.category)));

  return (
    <AppShell variant="admin">
      <div className="grid gap-4" data-testid="admin-assets-page">
        <Panel className="border-lime-300/20 bg-[linear-gradient(145deg,rgba(132,204,22,0.13),rgba(15,23,42,0.94))]">
          <Badge tone="good">Imagegen production assets</Badge>
          <h1 className="mt-3 text-3xl font-black text-white sm:text-5xl">
            Asset Gallery
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Project-local final assets generated from tracked imagegen source
            sheets, processed through chroma-key background removal, and
            verified by the release asset gate.
          </p>
        </Panel>

        {categories.map((category) => (
          <Panel data-testid={`asset-category-${category}`} key={category}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-xl font-black text-white">{category}</h2>
              <Badge>
                {assets.filter((asset) => asset.category === category).length}
              </Badge>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {assets
                .filter((asset) => asset.category === category)
                .map((asset) => (
                  <article
                    className="grid gap-3 rounded-lg border border-white/10 bg-slate-950/55 p-3"
                    data-testid={`asset-card-${asset.id}`}
                    key={asset.id}
                  >
                    <div className="grid aspect-square place-items-center rounded-md bg-[linear-gradient(135deg,#0f172a_0_25%,#f8fafc_25%_50%,#0f172a_50%_75%,#f8fafc_75%)] bg-[length:2rem_2rem] p-3">
                      <Image
                        alt={asset.altText}
                        className="max-h-full w-auto object-contain"
                        height={asset.dimensions.height}
                        src={publicPath(asset.finalAssetPath)}
                        width={asset.dimensions.width}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">
                        {asset.id}
                      </h3>
                      <p className="mt-1 text-xs leading-5 text-slate-400">
                        {asset.usage}
                      </p>
                    </div>
                  </article>
                ))}
            </div>
          </Panel>
        ))}
      </div>
    </AppShell>
  );
}
