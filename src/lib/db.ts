import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Next.js hot-reloads modules in development, which would otherwise open a new
 * connection pool on every save until Postgres refuses new connections.
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}

/** Transaction client type, for services that take either. */
export type DbClient = Omit<
  PrismaClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;
