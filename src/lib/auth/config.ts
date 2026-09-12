import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { db } from "@/lib/db";
import { env } from "@/lib/env";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(200),
});

/**
 * JWT sessions rather than database sessions, because Auth.js only supports
 * the Credentials provider with a JWT strategy.
 *
 * IMPORTANT: the token carries an id and nothing else that matters. Plan,
 * coin balance and every limit are read from the database on each request —
 * a stale or tampered token can never grant premium limits or coins.
 */
export const authConfig = {
  adapter: PrismaAdapter(db),
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  pages: {
    signIn: "/sign-in",
    newUser: "/dashboard",
    error: "/sign-in",
  },
  providers: [
    ...(env.google.configured
      ? [
          Google({
            clientId: env.google.id,
            clientSecret: env.google.secret,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    Credentials({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const user = await db.user.findUnique({
          where: { email: parsed.data.email.toLowerCase() },
          select: { id: true, email: true, name: true, image: true, passwordHash: true },
        });

        // Same failure for "no such user" and "wrong password", and the hash
        // comparison still runs, so the endpoint doesn't leak which emails exist.
        const hash = user?.passwordHash ?? "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidiu";
        const ok = await bcrypt.compare(parsed.data.password, hash);
        if (!user || !user.passwordHash || !ok) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.sub = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token.sub && session.user) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
