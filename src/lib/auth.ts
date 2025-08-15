import { SvelteKitAuth } from "@auth/sveltekit";
import { DrizzleAdapter } from "@auth/drizzle-adapter";

// ✅ Use SvelteKit provider imports
import Credentials from "@auth/sveltekit/providers/credentials";
import Google from "@auth/sveltekit/providers/google";
import GitHub from "@auth/sveltekit/providers/github";
import Email from "@auth/sveltekit/providers/email";

import bcrypt from "bcryptjs";
import crypto from "crypto";
import { eq } from "drizzle-orm";

import { db } from "./db";
import { users, accounts, sessions, verificationTokens } from "./db/schema";
import { sendVerificationEmail } from "$lib/email";

// --- Helper to create email verification token ---
async function generateVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}

// --- Main Auth.js config ---
export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),

  basePath: "/auth",
  secret: process.env.AUTH_SECRET,
  trustHost: true,

  session: {
    strategy: "database",
  },

  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },

  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await db.query.users.findFirst({
          where: eq(users.email, (credentials.email as string).toLowerCase()),
        });

        if (!user?.password) return null;

        const isValid = await bcrypt.compare(credentials.password as string, user.password as string);
        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      },
    }),

    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: { prompt: "consent", access_type: "offline", response_type: "code" },
      },
    }),

    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      authorization: {
        params: { scope: "read:user user:email" },
      },
    }),

    Email({
      server: {
        host: process.env.SMTP_HOST!,
        port: Number(process.env.SMTP_PORT!),
        auth: {
          user: process.env.SMTP_USER!,
          pass: process.env.SMTP_PASS!,
        },
      },
      from: process.env.SMTP_FROM!,
      sendVerificationRequest: async ({ identifier, url }) => {
        await sendVerificationEmail(identifier, url);
      },
    }),
  ],

  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        (session.user as any).role = (user as any).role;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider === "google" || account?.provider === "github") {
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!),
        });

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email!,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            role: "user",
          });
        }
      }
      return true;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  events: {
    async createUser({ user }) {
      if (user.email) {
        const token = await generateVerificationToken(user.email);
        // Use AUTH_URL directly without basePath to avoid warnings
        const url = `${process.env.AUTH_URL}/auth/verify?token=${token}`;
        await sendVerificationEmail(user.email, url);
      }
    },
  },
});
