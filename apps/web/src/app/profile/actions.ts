"use server";

import { auth } from "@/auth";
import { prisma } from "@meme-foundry/db";
import { founderProfileSchema } from "@meme-foundry/validation";
import { redirect } from "next/navigation";

export type ProfileActionState = { error?: string };

export async function saveFounderProfile(
  _state: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user) redirect("/signin");

  const parsed = founderProfileSchema.safeParse({
    displayName: formData.get("displayName"),
    bio: formData.get("bio")
  });

  if (!parsed.success) {
    return {
      error: parsed.error.issues[0]?.message ?? "Check your profile fields."
    };
  }

  await prisma.founderProfile.upsert({
    where: { userId: session.user.id },
    update: parsed.data,
    create: { userId: session.user.id, ...parsed.data }
  });

  redirect("/launch/new");
}
