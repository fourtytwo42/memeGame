"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  hideReportTargetForAdmin,
  resolveReportForAdmin,
  retryImageJobForAdmin,
  updateNarrativeForAdmin,
  updateSeasonForAdmin
} from "@/lib/server/moderation";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) redirect("/signin");
  if (session.user.role !== "admin") redirect("/play");
  return session.user;
}

export async function resolveReportAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  const resolution = String(formData.get("resolution") ?? "resolved").slice(
    0,
    240
  );
  await resolveReportForAdmin({ adminId: admin.id, reportId, resolution });
  revalidatePath("/admin");
}

export async function hideReportTargetAction(formData: FormData) {
  const admin = await requireAdmin();
  const reportId = String(formData.get("reportId") ?? "");
  await hideReportTargetForAdmin({ adminId: admin.id, reportId });
  revalidatePath("/admin");
  revalidatePath("/leaderboard");
}

export async function retryImageJobAction(formData: FormData) {
  const admin = await requireAdmin();
  const imageJobId = String(formData.get("imageJobId") ?? "");
  await retryImageJobForAdmin({ adminId: admin.id, imageJobId });
  revalidatePath("/admin");
}

export async function updateSeasonAction(formData: FormData) {
  const admin = await requireAdmin();
  const seasonId = String(formData.get("seasonId") ?? "");
  const status = String(formData.get("status") ?? "upcoming");
  const name = String(formData.get("name") ?? "").slice(0, 80);
  await updateSeasonForAdmin({ adminId: admin.id, seasonId, status, name });
  revalidatePath("/admin");
  revalidatePath("/seasons");
  revalidatePath("/leaderboard");
}

export async function updateNarrativeAction(formData: FormData) {
  const admin = await requireAdmin();
  const narrativeId = String(formData.get("narrativeId") ?? "");
  await updateNarrativeForAdmin({
    adminId: admin.id,
    narrativeId,
    heat: Number(formData.get("heat") ?? 0),
    memePotential: Number(formData.get("memePotential") ?? 0),
    saturation: Number(formData.get("saturation") ?? 0),
    fatigue: Number(formData.get("fatigue") ?? 0)
  });
  revalidatePath("/admin");
  revalidatePath("/seasons");
}
