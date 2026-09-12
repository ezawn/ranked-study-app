/**
 * Stand-in for the `server-only` package under Vitest.
 *
 * The real package throws when it is imported outside a React Server Component
 * build, which is exactly what makes it useful in the app and useless in a test
 * runner. Aliased in vitest.config.ts.
 */
export {};
