"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  executeSupportActionForUser,
  isSupportActionId,
  SupportActionError
} from "@/lib/server/support-actions";

function stringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}

export async function supportTokenAction(formData: FormData) {
  const tokenId = stringValue(formData, "tokenId");
  const actionId = stringValue(formData, "actionId");
  const nonce = stringValue(formData, "nonce");
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);

  let target: string;
  try {
    if (!tokenId || !nonce || !isSupportActionId(actionId)) {
      throw new SupportActionError("Choose a valid support action.");
    }
    await executeSupportActionForUser({
      userId: session.user.id,
      tokenId,
      actionId,
      nonce
    });
    target = `/token/${tokenId}?support=${encodeURIComponent(actionId)}`;
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Support action could not be applied.";
    target = `/token/${tokenId}?error=${encodeURIComponent(message)}`;
  }
  redirect(target as Route);
}
