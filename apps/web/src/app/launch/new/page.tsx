import { redirect } from "next/navigation";
import { Badge, Panel } from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { LaunchWizardForm } from "@/components/launch/launch-wizard-form";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function LaunchNewPage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const profile = await prisma.founderProfile.findUnique({
    where: { userId: session.user.id }
  });
  if (!profile) redirect("/profile");

  const season = await prisma.season.findFirst({
    where: { status: "active" },
    orderBy: { startsAt: "desc" }
  });
  const narratives = season
    ? await prisma.narrativeMeta.findMany({
        where: { seasonId: season.id },
        orderBy: [{ heat: "desc" }, { name: "asc" }],
        take: 8
      })
    : [];

  return (
    <AppShell>
      <div className="mb-4" data-testid="launch-wizard-shell">
        <Panel>
          <Badge tone="good">Fast guided launch</Badge>
          <h1 className="mt-3 text-3xl font-black text-white">Launch wizard</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
            Create a simulated token in one guided pass. The preview updates
            immediately, narrative choices use plain opportunity labels, and
            placeholder art means launch never waits for AI or image generation.
          </p>
        </Panel>
      </div>
      <LaunchWizardForm
        narratives={narratives.map((narrative) => ({
          slug: narrative.slug,
          name: narrative.name,
          heat: narrative.heat,
          saturation: narrative.saturation,
          fatigue: narrative.fatigue
        }))}
      />
    </AppShell>
  );
}
