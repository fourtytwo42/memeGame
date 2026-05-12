import { redirect } from "next/navigation";
import { Panel } from "@meme-foundry/ui";
import { auth } from "@/auth";
import { AppShell } from "@/components/shell/app-shell";
import { ProfileForm } from "@/components/launch/profile-form";
import { prisma } from "@meme-foundry/db";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  const profile = await prisma.founderProfile.findUnique({
    where: { userId: session.user.id }
  });

  return (
    <AppShell>
      <div className="mx-auto grid max-w-2xl gap-4" data-testid="profile-page">
        <Panel>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-emerald-300">
            First-run setup
          </p>
          <h1 className="mt-2 text-3xl font-black text-white">
            Create founder profile
          </h1>
          <p className="mt-3 text-sm leading-6 text-slate-300">
            This is your in-game founder identity. Keep it fictional and
            readable; the next step launches your first simulated token.
          </p>
        </Panel>
        <Panel>
          <ProfileForm
            defaultBio={profile?.bio ?? ""}
            defaultDisplayName={
              profile?.displayName ?? session.user.name ?? session.user.username
            }
          />
        </Panel>
      </div>
    </AppShell>
  );
}
