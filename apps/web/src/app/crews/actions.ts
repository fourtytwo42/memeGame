"use server";

import type { Route } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  createCrewForUser,
  CrewActionError,
  executeCrewActionForUser,
  featureTokenForCrew,
  isCrewActionId,
  joinCrewForUser
} from "@/lib/server/crew-actions";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw : "";
}

export async function createCrewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);
  let target: string;
  try {
    const crew = await createCrewForUser({
      userId: session.user.id,
      name: value(formData, "name"),
      description: value(formData, "description"),
      tagline: value(formData, "tagline")
    });
    target = `/crews/${crew.slug}?notice=created`;
  } catch (error) {
    target = `/crews?error=${encodeURIComponent(error instanceof Error ? error.message : "Crew could not be created.")}`;
  }
  redirect(target as Route);
}

export async function joinCrewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);
  const crewId = value(formData, "crewId");
  const slug = value(formData, "slug");
  let target = `/crews/${slug}?notice=joined`;
  try {
    await joinCrewForUser({ userId: session.user.id, crewId });
  } catch (error) {
    target = `/crews/${slug}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not join crew.")}`;
  }
  redirect(target as Route);
}

export async function featureCrewTokenAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);
  const crewId = value(formData, "crewId");
  const slug = value(formData, "slug");
  const tokenId = value(formData, "tokenId");
  let target = `/crews/${slug}?notice=featured`;
  try {
    await featureTokenForCrew({ userId: session.user.id, crewId, tokenId });
  } catch (error) {
    target = `/crews/${slug}?error=${encodeURIComponent(error instanceof Error ? error.message : "Could not feature launch.")}`;
  }
  redirect(target as Route);
}

export async function runCrewAction(formData: FormData) {
  const session = await auth();
  if (!session?.user) redirect("/signin" as Route);
  const crewId = value(formData, "crewId");
  const slug = value(formData, "slug");
  const actionId = value(formData, "actionId");
  const nonce = value(formData, "nonce");
  let target = `/crews/${slug}?notice=action-${actionId}`;
  try {
    if (!isCrewActionId(actionId) || !nonce) {
      throw new CrewActionError("Choose a valid crew action.");
    }
    await executeCrewActionForUser({
      userId: session.user.id,
      crewId,
      actionId,
      nonce
    });
  } catch (error) {
    target = `/crews/${slug}?error=${encodeURIComponent(error instanceof Error ? error.message : "Crew action failed.")}`;
  }
  redirect(target as Route);
}
