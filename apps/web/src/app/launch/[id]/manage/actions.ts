"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  ActionLoopError,
  executeActionForUser,
  isActionId
} from "@/lib/server/action-loop";

function managePath(tokenId: string, params: Record<string, string>) {
  const query = new URLSearchParams(params);
  return `/launch/${tokenId}/manage?${query.toString()}` as Route;
}

export async function executeTokenAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);

  const tokenId = String(formData.get("tokenId") ?? "");
  const actionIdValue = String(formData.get("actionId") ?? "");
  const nonce = String(formData.get("nonce") ?? "");
  const confirmedRisk = formData.get("confirmRisk") === "on";

  if (!tokenId || !isActionId(actionIdValue) || !nonce) {
    redirect("/play" as Route);
  }

  try {
    await executeActionForUser({
      userId: session.user.id,
      tokenId,
      actionId: actionIdValue,
      nonce,
      confirmedRisk
    });
  } catch (error) {
    if (error instanceof ActionLoopError) {
      redirect(managePath(tokenId, { error: error.message }));
    }
    throw error;
  }

  revalidatePath(`/launch/${tokenId}/manage`);
  revalidatePath("/play");
  redirect(managePath(tokenId, { action: actionIdValue }));
}
