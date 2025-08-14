import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';
import Credentials from '@auth/sveltekit/providers/credentials';
import { db } from '../db';
import { accounts, sessions, users, verificationTokens } from '../db/schema';
import { env } from '$env/dynamic/private';
import { eq } from 'drizzle-orm';
import { authenticateUser } from './utils';

// Build providers array with proper error handling
const providers = [] as any[];

// Add Credentials provider for email/password with role awareness
providers.push(
  Credentials({
    name: 'Credentials',
    credentials: {
      email: { label: 'Email', type: 'email', placeholder: 'you@example.com' },
      password: { label: 'Password', type: 'password' },
      role: { label: 'Role', type: 'text' } // optional; defaults to 'user' client-side
    },
    authorize: async (creds) => {
      if (!creds?.email || !creds?.password) return null;
      const desiredRole = (creds.role === 'admin' ? 'admin' : 'user') as 'user' | 'admin';

      const result = await authenticateUser(creds.email, creds.password);
      if (!result.success || !result.user) return null;

      // Enforce role-based login: only allow admin role login if user is admin
      if (desiredRole === 'admin' && result.user.role !== 'admin') return null;

      // Optional domain restriction for admin sign-ins
      const adminDomain = env.ADMIN_EMAIL_DOMAIN;
      if (
        desiredRole === 'admin' &&
        adminDomain &&
        result.user.email &&
        !result.user.email.endsWith(`@${adminDomain}`)
      ) {
        return null;
      }

      // Return user object for session creation
      return {
        id: result.user.id,
        name: result.user.name ?? null,
        email: result.user.email,
        image: result.user.image ?? null,
        role: result.user.role,
        isEmailVerified: result.user.isEmailVerified
      } as any;
    }
  })
);

// Add Google provider if configured (check for placeholder values)
if (env.GOOGLE_CLIENT_ID && 
    env.GOOGLE_CLIENT_SECRET && 
    env.GOOGLE_CLIENT_ID !== 'your-google-client-id' && 
    env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret') {
  providers.push(
    Google({
      clientId: env.GOOGLE_CLIENT_ID,
      clientSecret: env.GOOGLE_CLIENT_SECRET
    })
  );
} else {
  console.log('Google OAuth not configured - missing or placeholder GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET');
}

// Add GitHub provider if configured (check for placeholder values)
if (env.GITHUB_CLIENT_ID && 
    env.GITHUB_CLIENT_SECRET && 
    env.GITHUB_CLIENT_ID !== 'your-github-client-id' && 
    env.GITHUB_CLIENT_SECRET !== 'your-github-client-secret') {
  providers.push(
    GitHub({
      clientId: env.GITHUB_CLIENT_ID,
      clientSecret: env.GITHUB_CLIENT_SECRET
    })
  );
} else {
  console.log('GitHub OAuth not configured - missing or placeholder GITHUB_CLIENT_ID/GITHUB_CLIENT_SECRET');
}

// If no OAuth providers are configured, add a minimal Google provider to satisfy Auth.js
if (providers.length === 0) {
  console.log('No OAuth providers configured. Adding minimal Google provider for Auth.js compatibility.');
  providers.push(
    Google({
      clientId: 'dummy-client-id',
      clientSecret: 'dummy-client-secret'
    })
  );
}

export const { handle, signIn, signOut } = SvelteKitAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens
  }),
  providers,
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        const dbUser = user as any;
        session.user.role = (dbUser.role as 'user' | 'admin') ?? 'user';
        session.user.isEmailVerified = Boolean(dbUser.isEmailVerified || dbUser.emailVerified);
      }
      return session;
    },
    async signIn({ user, account }) {
      const adminDomain = env.ADMIN_EMAIL_DOMAIN;
      if (adminDomain && user.email && (user as any).role === 'admin' && !user.email.endsWith(`@${adminDomain}`)) {
        return false;
      }
      if (account?.provider !== 'credentials' && user.email) {
        try {
          await db
            .update(users)
            .set({
              emailVerified: new Date(),
              isEmailVerified: true
            })
            .where(eq(users.email, user.email));
        } catch (error) {
          console.error('Error updating user verification status:', error);
        }
      }
      return true;
    }
  },
  session: {
    strategy: 'database',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60 // 24 hours
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  secret: env.AUTH_SECRET,
  trustHost: true
});