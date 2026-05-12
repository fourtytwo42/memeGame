import { z } from "zod";

const blockedTerms = [
  "financial advice",
  "real profit",
  "guaranteed return",
  "official solana"
];

function hasBlockedTerm(value: string) {
  const normalized = value.toLowerCase();
  return blockedTerms.some((term) => normalized.includes(term));
}

export const tokenTickerSchema = z
  .string()
  .trim()
  .min(2, "Use 2-12 uppercase letters or numbers.")
  .max(12, "Use 2-12 uppercase letters or numbers.")
  .regex(/^[A-Z0-9]+$/, "Ticker must use uppercase letters and numbers only.");

export const founderProfileSchema = z.object({
  displayName: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .refine((value) => !hasBlockedTerm(value), "Use a fictional game name."),
  bio: z.string().trim().max(240).optional().default("")
});

export const launchTokenSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2)
    .max(48)
    .refine((value) => !hasBlockedTerm(value), "Use a fictional token name."),
  ticker: tokenTickerSchema,
  description: z
    .string()
    .trim()
    .min(10)
    .max(220)
    .refine(
      (value) => !hasBlockedTerm(value),
      "Keep descriptions fictional and non-financial."
    ),
  narrativeSlug: z.string().trim().min(2).max(64),
  mascotPrompt: z
    .string()
    .trim()
    .min(5)
    .max(180)
    .refine(
      (value) => !hasBlockedTerm(value),
      "Keep mascot prompts fictional."
    ),
  founderStance: z.enum([
    "careful-builder",
    "community-chaos",
    "meme-maxi",
    "trust-first"
  ]),
  strategy: z.enum(["balanced", "growth", "community", "trust"]),
  riskLevel: z.enum(["low", "medium", "high"])
});

export type LaunchTokenInput = z.infer<typeof launchTokenSchema>;
export type FounderProfileInput = z.infer<typeof founderProfileSchema>;
