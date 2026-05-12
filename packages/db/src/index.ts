import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function connectionString() {
  const value = process.env.DATABASE_URL;
  if (!value) {
    throw new Error("DATABASE_URL is required to initialize Prisma.");
  }
  return value;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: connectionString() }),
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"]
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export type DbClient = PrismaClient;

export function adminEmailSet(source = process.env.ADMIN_EMAILS ?? "") {
  return new Set(
    source
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function roleForEmail(email: string | null | undefined) {
  if (!email) return "user";
  return adminEmailSet().has(email.toLowerCase()) ? "admin" : "user";
}

export function normalizeIdentifier(identifier: string) {
  return identifier.trim().toLowerCase();
}

export async function findUserByIdentifier(identifier: string) {
  const normalized = normalizeIdentifier(identifier);
  return prisma.user.findFirst({
    where: {
      OR: [{ email: normalized }, { username: normalized }],
      status: "active"
    }
  });
}
