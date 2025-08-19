import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

// ✅ Use SvelteKit provider imports
import Credentials from '@auth/sveltekit/providers/credentials';
import Email from '@auth/sveltekit/providers/email';
import Google from '@auth/sveltekit/providers/google';
import GitHub from '@auth/sveltekit/providers/github';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';

import { 
	AUTH_SECRET, 
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	GOOGLE_REDIRECT_URI,
	GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET,
	GITHUB_REDIRECT_URI
} from '$env/static/private';
import { db } from './db';
import { users, accounts, sessions, verificationTokens } from './db/schema';
import { sendVerificationEmail } from '$lib/email';

// --- Helper to create email verification token ---
async function generateVerificationToken(email: string) {
	const token = crypto.randomUUID();
	const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h expiry

	await db.insert(verificationTokens).values({
		identifier: email,
		token,
		expires
	});

	return token;
}

// --- Main Auth.js config ---
export const { handle, signIn, signOut } = SvelteKitAuth({
	adapter: DrizzleAdapter(db, {
		usersTable: users,
		accountsTable: accounts,
		sessionsTable: sessions,
		verificationTokensTable: verificationTokens
	}),

	secret: AUTH_SECRET,
	trustHost: true,

	session: {
		strategy: 'database'
	},

	pages: {
		signIn: '/auth/signin',
		verifyRequest: '/auth/verify-request',
		error: '/auth/error'
	},

	providers: [
		// Google OAuth Provider
		Google({
			clientId: GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			authorization: {
				params: {
					prompt: "consent",
					access_type: "offline",
					response_type: "code"
				}
			}
		}),

		// GitHub OAuth Provider
		GitHub({
			clientId: GITHUB_CLIENT_ID,
			clientSecret: GITHUB_CLIENT_SECRET,
			authorization: {
				params: {
					scope: 'read:user user:email'
				}
			}
		}),

		// Temporarily disabled EmailProvider to use only custom verification
		// Email({
		// 	server: {
		// 		host: GMAIL_USER ? 'smtp.gmail.com' : undefined,
		// 		port: GMAIL_USER ? 587 : undefined,
		// 		auth: GMAIL_USER ? {
		// 			user: GMAIL_USER,
		// 			pass: GMAIL_APP_PASSWORD
		// 		} : undefined
		// 	},
		// 	from: GMAIL_USER ? `"Vanar Chain" <${GMAIL_USER}>` : 'noreply@vanarchain.com',
		// 	sendVerificationRequest: async ({ identifier, url, provider }) => {
		// 		console.log('Auth.js EmailProvider sendVerificationRequest called with:', { identifier, url, provider });
		// 		if (GMAIL_USER && GMAIL_APP_PASSWORD) {
		// 			// Use our custom email function
		// 			await sendVerificationEmail(identifier, url);
		// 			}
		// 		} else {
		// 			console.log('Verification email would be sent to:', identifier);
		// 			console.log('Verification URL:', url);
		// 		}
		// 	}
		// }),
		
		// OAuth providers are now enabled
	],

	callbacks: {
		async session({ session, user }) {
			if (session.user) {
				session.user.id = user.id;
				(session.user as any).role = (user as any).role;
			}
			return session;
		},

		async signIn({ user, account, profile }) {
			// If user signs in with OAuth, mark them as verified and set default role
			if (account?.provider === 'google' || account?.provider === 'github') {
				// OAuth users are automatically verified
				// Set default role to "user" for OAuth users
				if (user.id) {
					await db.update(users)
						.set({ role: 'user' })
						.where(eq(users.id, user.id));
				}
				return true;
			}
			
			// For credentials provider, check if user is verified
			if (account?.provider === 'credentials') {
				const dbUser = await db.query.users.findFirst({
					where: eq(users.email, user.email!)
				});
				
				if (dbUser && !dbUser.emailVerified) {
					return false; // Prevent unverified users from signing in
				}
			}
			
			return true;
		},

		async redirect({ url, baseUrl }) {
			// Handle OAuth redirects properly
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			if (new URL(url).origin === baseUrl) return url;
			
			// Default redirect to dashboard after successful OAuth
			return `${baseUrl}/dashboard`;
		}
	},

	events: {
		async createUser({ user }) {
			// Only send verification emails for credential-based users
			// OAuth users are automatically verified
			if (user.email && user.id) {
				// Check if this is an OAuth user by looking at the accounts table
				const userAccount = await db.query.accounts.findFirst({
					where: eq(accounts.userId, user.id)
				});
				
				// Only send verification for credential-based users
				if (!userAccount || (userAccount.provider !== 'google' && userAccount.provider !== 'github')) {
					console.log('Creating verification token for credential user:', user.email);
					const token = await generateVerificationToken(user.email);
					// Use relative URL since we're not using basePath
					const url = `/auth/verify?token=${token}`;
					console.log('Generated verification URL:', url);
					// Note: In Auth.js context, we can't easily get the baseUrl, so we'll use a fallback
					await sendVerificationEmail(user.email, url, 'http://localhost:5173');
				}
			}
		}
	}
});
