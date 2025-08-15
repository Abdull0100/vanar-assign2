import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Credentials from '@auth/core/providers/credentials';
import Google from '@auth/core/providers/google';
import GitHub from '@auth/core/providers/github';
import Email from '@auth/core/providers/email';
import { db } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail, sendPasswordResetEmail } from '$lib/email';
import { eq } from 'drizzle-orm';

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  // OAuth callback URLs will be: {AUTH_URL}/auth/callback/{provider}
  basePath: '/auth',
  secret: process.env.AUTH_SECRET,
  trustHost: true,
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials: any) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.query.users.findFirst({
          where: eq(users.email, credentials.email as string)
        });

        if (!user || !user.password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(credentials.password as string, user.password as string);
        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
        };
      }
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // Explicitly set redirect URI to match OAuth app configuration
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      // Explicitly set redirect URI to match OAuth app configuration
      authorization: {
        params: {
          scope: "read:user user:email"
        }
      }
    }),
    Email({
      server: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      },
      from: process.env.SMTP_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        await sendVerificationEmail(identifier, url);
      },
    }),
  ],
  session: {
    strategy: 'database',
  },
  pages: {
    signIn: '/auth/signin',
    verifyRequest: '/auth/verify-request',
    error: '/auth/error',
  },
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = (user as any).role;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        // Check if user exists, if not create with OAuth data
        const existingUser = await db.query.users.findFirst({
          where: eq(users.email, user.email!)
        });

        if (!existingUser) {
          await db.insert(users).values({
            email: user.email!,
            name: user.name,
            image: user.image,
            emailVerified: new Date(),
            role: 'user',
          });
        }
      }
      return true;
    },
    async redirect({ url, baseUrl }) {
      // Handle redirects properly for OAuth
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.email) {
        // Send verification email for credentials signup
        const token = await generateVerificationToken(user.email);
        const url = `${process.env.AUTH_URL}/auth/verify?token=${token}`;
        await sendVerificationEmail(user.email, url);
      }
    },
  },
});

async function generateVerificationToken(email: string) {
  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await db.insert(verificationTokens).values({
    identifier: email,
    token,
    expires,
  });

  return token;
}
