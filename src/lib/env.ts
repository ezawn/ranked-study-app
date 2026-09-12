/**
 * Environment configuration.
 *
 * Server-only. Nothing here is bundled into the client — none of these values
 * is prefixed NEXT_PUBLIC_, and the AI keys in particular must never leave the
 * server.
 */

import "server-only";

import { MAIL_FROM_NAME } from "@/lib/brand";

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(
      `Missing required environment variable ${name}. Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function optional(value: string | undefined, fallback: string): string {
  return value && value.length > 0 ? value : fallback;
}

export const env = {
  databaseUrl: required("DATABASE_URL", process.env.DATABASE_URL),

  authSecret: required("AUTH_SECRET", process.env.AUTH_SECRET),
  authUrl: optional(process.env.AUTH_URL, "http://localhost:3000"),

  google: {
    id: process.env.AUTH_GOOGLE_ID ?? "",
    secret: process.env.AUTH_GOOGLE_SECRET ?? "",
    get configured() {
      return this.id.length > 0 && this.secret.length > 0;
    },
  },

  ai: {
    provider: optional(process.env.AI_PROVIDER, "mock") as "mock" | "anthropic",
    anthropicKey: process.env.ANTHROPIC_API_KEY ?? "",
    anthropicModel: optional(process.env.ANTHROPIC_MODEL, "claude-sonnet-4-5"),
  },

  storage: {
    driver: optional(process.env.STORAGE_DRIVER, "local") as "local" | "s3",
    localDir: optional(process.env.STORAGE_LOCAL_DIR, "./storage"),
    s3: {
      bucket: process.env.S3_BUCKET ?? "",
      region: process.env.S3_REGION ?? "",
      endpoint: process.env.S3_ENDPOINT ?? "",
      accessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
    },
  },

  mail: {
    resendKey: process.env.RESEND_API_KEY ?? "",
    from: optional(process.env.MAIL_FROM, `${MAIL_FROM_NAME} <onboarding@resend.dev>`),
    get configured() {
      return this.resendKey.length > 0;
    },
  },

  cronSecret: optional(process.env.CRON_SECRET, "change-me-in-production"),

  isProduction: process.env.NODE_ENV === "production",
} as const;

/** True when the AI layer will call a real model rather than the local stand-in. */
export function usingRealAi(): boolean {
  return env.ai.provider === "anthropic" && env.ai.anthropicKey.length > 0;
}
