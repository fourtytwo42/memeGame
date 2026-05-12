import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  TEST_DATABASE_URL: z.string().url().optional(),
  REDIS_URL: z.string().url().optional(),
  REDIS_KEY_PREFIX: z.string().optional(),
  AUTH_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(16).optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(16).optional(),
  ADMIN_EMAILS: z.string().optional(),
  LOCAL_LLM_BASE_URL: z.string().url().optional(),
  LOCAL_LLM_MODEL: z.string().optional(),
  IMAGE_BACKEND: z.string().optional()
});

export function readEnv(source: NodeJS.ProcessEnv = process.env) {
  return envSchema.parse(source);
}
