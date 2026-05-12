import { describe, expect, it } from "vitest";
import { prisma } from "../../packages/db/src/index";
import {
  AdminPermissionError,
  hideReportTargetForAdmin,
  resolveReportForAdmin,
  retryImageJobForAdmin,
  updateNarrativeForAdmin,
  updateSeasonForAdmin
} from "../../apps/web/src/lib/server/moderation";

async function fixture(label: string) {
  const suffix = `${label}-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const season = await prisma.season.findFirstOrThrow({
    where: { status: "active" }
  });
  const [admin, user] = await Promise.all([
    prisma.user.create({
      data: {
        email: `admin-${suffix}@example.com`,
        username: `admin_${suffix.replace(/[^a-z0-9_]/gi, "_")}`,
        role: "admin",
        status: "active"
      }
    }),
    prisma.user.create({
      data: {
        email: `user-${suffix}@example.com`,
        username: `user_${suffix.replace(/[^a-z0-9_]/gi, "_")}`,
        status: "active"
      }
    })
  ]);
  const token = await prisma.launchToken.create({
    data: {
      userId: user.id,
      seasonId: season.id,
      name: `Reported ${suffix}`,
      ticker: `R${Date.now().toString().slice(-5)}`,
      narrative: "AI Mascots",
      narrativeSlug: "ai-mascots",
      status: "live"
    }
  });
  return { admin, season, suffix, token, user };
}

describe("stage 14 admin operations", () => {
  it("lets admins resolve reports and logs the action", async () => {
    const { admin, token, user } = await fixture("resolve");
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: "token",
        targetId: token.id,
        category: "Spam/abuse",
        detail: "Looks spammy."
      }
    });
    const resolved = await resolveReportForAdmin({
      adminId: admin.id,
      reportId: report.id,
      resolution: "noted"
    });
    expect(resolved.status).toBe("resolved");
    await expect(
      prisma.adminAction.findFirstOrThrow({
        where: { actorId: admin.id, actionType: "resolve_report" }
      })
    ).resolves.toBeTruthy();
  });

  it("hides reported token targets and blocks non-admins", async () => {
    const { admin, token, user } = await fixture("hide");
    const report = await prisma.report.create({
      data: {
        reporterId: user.id,
        targetType: "token",
        targetId: token.id,
        category: "Offensive name"
      }
    });
    await expect(
      hideReportTargetForAdmin({ adminId: user.id, reportId: report.id })
    ).rejects.toThrow(AdminPermissionError);
    await hideReportTargetForAdmin({ adminId: admin.id, reportId: report.id });
    await expect(
      prisma.launchToken.findUniqueOrThrow({ where: { id: token.id } })
    ).resolves.toMatchObject({ status: "hidden" });
  });

  it("lets admins retry failed image jobs", async () => {
    const { admin, token } = await fixture("image");
    const imageJob = await prisma.imageJob.create({
      data: {
        tokenId: token.id,
        status: "failed",
        prompt: "test prompt",
        error: "failed"
      }
    });
    const retried = await retryImageJobForAdmin({
      adminId: admin.id,
      imageJobId: imageJob.id
    });
    expect(retried.status).toBe("queued");
    expect(retried.error).toBeNull();
  });

  it("lets admins update seasons and narrative tuning", async () => {
    const { admin, season, suffix } = await fixture("world");
    const updatedSeason = await updateSeasonForAdmin({
      adminId: admin.id,
      seasonId: season.id,
      name: `${season.name} ${suffix.slice(0, 8)}`,
      status: "active"
    });
    expect(updatedSeason.status).toBe("active");

    const narrative = await prisma.narrativeMeta.findFirstOrThrow({
      where: { seasonId: season.id }
    });
    const updatedNarrative = await updateNarrativeForAdmin({
      adminId: admin.id,
      narrativeId: narrative.id,
      heat: 87,
      memePotential: 92,
      saturation: 12,
      fatigue: 9
    });
    expect(updatedNarrative).toMatchObject({
      heat: 87,
      memePotential: 92,
      saturation: 12,
      fatigue: 9
    });
    await expect(
      prisma.adminAction.findFirstOrThrow({
        where: { actorId: admin.id, actionType: "update_narrative" }
      })
    ).resolves.toBeTruthy();
  });
});
