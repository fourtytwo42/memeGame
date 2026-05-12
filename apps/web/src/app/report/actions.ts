"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { prisma } from "@meme-foundry/db";

const allowedCategories = new Set([
  "Offensive name",
  "Offensive image",
  "Harassment",
  "Impersonation",
  "Real financial advice",
  "Spam/abuse",
  "Other"
]);

export async function reportTargetAction(formData: FormData) {
  const session = await auth();
  const targetType = String(formData.get("targetType") ?? "");
  const targetId = String(formData.get("targetId") ?? "");
  const category = String(formData.get("category") ?? "Other");
  const detail = String(formData.get("detail") ?? "")
    .trim()
    .slice(0, 500);
  if (!["token", "crew", "user"].includes(targetType)) {
    return { error: "Unknown report target." };
  }
  if (!targetId) return { error: "Missing report target." };
  await prisma.report.create({
    data: {
      reporterId: session?.user?.id,
      targetType,
      targetId,
      category: allowedCategories.has(category) ? category : "Other",
      detail: detail || null
    }
  });
  if (targetType === "token") revalidatePath(`/token/${targetId}`);
  if (targetType === "crew") revalidatePath("/crews");
  return { ok: true };
}
