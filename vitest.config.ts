import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: true,
  },
  resolve: {
    alias: {
      // More specific first — Vite matches aliases in order.
      //
      // `@/lib/db` builds a PrismaClient at module scope, and Prisma will not
      // construct one without DATABASE_URL, which Vitest does not load from
      // `.env`. The stub throws if anything actually uses it; service tests
      // inject their own client.
      "@/lib/db": path.resolve(__dirname, "./tests/stubs/db.ts"),
      "@": path.resolve(__dirname, "./src"),
      // `server-only` throws on import outside a React Server Component build.
      // The suite only exercises pure logic, but aliasing it keeps the door open
      // for a test that pulls in a service module.
      "server-only": path.resolve(__dirname, "./tests/stubs/server-only.ts"),
    },
  },
});
