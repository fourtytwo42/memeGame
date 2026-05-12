"use server";

import { signIn, signOut } from "@/auth";
import { AuthError } from "next-auth";

export type SignInState = {
  error?: string;
};

export async function credentialsSignIn(
  _state: SignInState,
  formData: FormData
): Promise<SignInState> {
  try {
    await signIn("credentials", {
      identifier: String(formData.get("identifier") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirectTo: "/"
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "The username/email and password did not match." };
    }
    throw error;
  }
  return {};
}

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}
