/**
 * Stand-in for the Prisma singleton under Vitest.
 *
 * `@/lib/db` constructs a PrismaClient at module scope, and Prisma refuses to
 * construct one without DATABASE_URL. Next loads `.env`; Vitest does not — so
 * importing any service module in a test would fail on the import alone,
 * before a single assertion ran.
 *
 * There is no database in the test environment and there is not meant to be.
 * Service tests inject their own transaction client (see coin-engine.test.ts),
 * so nothing should ever reach this object; touching it throws rather than
 * silently returning undefined and failing three steps later.
 *
 * Aliased in vitest.config.ts.
 */

const refuse = (path: string): never => {
  throw new Error(
    `The test suite has no database. Something reached db.${path} — pass a fake ` +
      `client into the function under test instead of letting it fall back to the singleton.`,
  );
};

export const db: unknown = new Proxy(
  {},
  {
    get(_target, model: string) {
      if (model === "then") return undefined; // not a thenable
      return new Proxy(
        {},
        {
          get(_t, method: string) {
            return () => refuse(`${model}.${method}`);
          },
        },
      );
    },
  },
);

export type DbClient = unknown;
