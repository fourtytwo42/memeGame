import { prisma } from "@meme-foundry/db";

export class AdminPermissionError extends Error {}

async function requireAdminUser(adminId: string) {
  const user = await prisma.user.findUnique({ where: { id: adminId } });
  if (!user || user.role !== "admin" || user.status !== "active") {
    throw new AdminPermissionError("Admin privileges are required.");
  }
  return user;
}

export async function resolveReportForAdmin({
  adminId,
  reportId,
  resolution = "reviewed"
}: {
  adminId: string;
  reportId: string;
  resolution?: string;
}) {
  await requireAdminUser(adminId);
  const report = await prisma.report.update({
    where: { id: reportId },
    data: {
      status: "resolved",
      resolution,
      resolvedAt: new Date(),
      resolvedById: adminId
    }
  });
  await prisma.adminAction.create({
    data: {
      actorId: adminId,
      actionType: "resolve_report",
      targetType: "report",
      targetId: report.id,
      detailJson: { resolution, reportTarget: report.targetType }
    }
  });
  return report;
}

export async function hideReportTargetForAdmin({
  adminId,
  reportId
}: {
  adminId: string;
  reportId: string;
}) {
  await requireAdminUser(adminId);
  const report = await prisma.report.findUniqueOrThrow({
    where: { id: reportId }
  });
  if (report.targetType === "token") {
    await prisma.launchToken.update({
      where: { id: report.targetId },
      data: { status: "hidden" }
    });
  } else if (report.targetType === "crew") {
    await prisma.crew.update({
      where: { id: report.targetId },
      data: { moderationStatus: "hidden" }
    });
  } else if (report.targetType === "user") {
    await prisma.user.update({
      where: { id: report.targetId },
      data: { status: "suspended" }
    });
  }
  const updated = await prisma.report.update({
    where: { id: report.id },
    data: {
      status: "resolved",
      resolution: `hidden ${report.targetType}`,
      resolvedAt: new Date(),
      resolvedById: adminId
    }
  });
  await prisma.adminAction.create({
    data: {
      actorId: adminId,
      actionType: "hide_report_target",
      targetType: report.targetType,
      targetId: report.targetId,
      detailJson: { reportId: report.id, category: report.category }
    }
  });
  return updated;
}

export async function retryImageJobForAdmin({
  adminId,
  imageJobId
}: {
  adminId: string;
  imageJobId: string;
}) {
  await requireAdminUser(adminId);
  const imageJob = await prisma.imageJob.update({
    where: { id: imageJobId },
    data: { status: "queued", error: null }
  });
  await prisma.adminAction.create({
    data: {
      actorId: adminId,
      actionType: "retry_image_job",
      targetType: "imageJob",
      targetId: imageJob.id,
      detailJson: { tokenId: imageJob.tokenId }
    }
  });
  return imageJob;
}

export async function updateSeasonForAdmin({
  adminId,
  seasonId,
  status,
  name
}: {
  adminId: string;
  seasonId: string;
  status: string;
  name?: string;
}) {
  await requireAdminUser(adminId);
  const season = await prisma.season.update({
    where: { id: seasonId },
    data: {
      name: name?.trim() || undefined,
      status
    }
  });
  await prisma.adminAction.create({
    data: {
      actorId: adminId,
      actionType: "update_season",
      targetType: "season",
      targetId: season.id,
      detailJson: { name: season.name, status: season.status }
    }
  });
  return season;
}

export async function updateNarrativeForAdmin({
  adminId,
  narrativeId,
  heat,
  memePotential,
  saturation,
  fatigue
}: {
  adminId: string;
  narrativeId: string;
  heat: number;
  memePotential: number;
  saturation: number;
  fatigue: number;
}) {
  await requireAdminUser(adminId);
  const clamp = (value: number) =>
    Math.max(0, Math.min(100, Math.round(value)));
  const narrative = await prisma.narrativeMeta.update({
    where: { id: narrativeId },
    data: {
      heat: clamp(heat),
      memePotential: clamp(memePotential),
      saturation: clamp(saturation),
      fatigue: clamp(fatigue)
    }
  });
  await prisma.adminAction.create({
    data: {
      actorId: adminId,
      actionType: "update_narrative",
      targetType: "narrative",
      targetId: narrative.id,
      detailJson: {
        heat: narrative.heat,
        memePotential: narrative.memePotential,
        saturation: narrative.saturation,
        fatigue: narrative.fatigue
      }
    }
  });
  return narrative;
}
