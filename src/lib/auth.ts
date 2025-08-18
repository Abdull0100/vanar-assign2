import { SvelteKitAuth } from '@auth/sveltekit';
import { DrizzleAdapter } from '@auth/drizzle-adapter';

// ✅ Use SvelteKit provider imports
import Credentials from '@auth/sveltekit/providers/credentials';
import Email from '@auth/sveltekit/providers/email';

import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { AUTH_SECRET, GMAIL_USER, GMAIL_APP_PASSWORD,GOOGLE_SECRET,GOOGLE_ID,GITHUB_ID,GITHUB_SECRET } from '$env/static/private';
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
		
		// OAuth providers are disabled - using custom OAuth handlers instead
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
			// OAuth providers are disabled - using custom OAuth handlers instead
			return true;
		},

		async redirect({ url, baseUrl }) {
			if (url.startsWith('/')) return `${baseUrl}${url}`;
			if (new URL(url).origin === baseUrl) return url;
			return baseUrl;
		}
	},

	events: {
		async createUser({ user }) {
			if (user.email) {
				console.log('Creating verification token for user:', user.email);
				const token = await generateVerificationToken(user.email);
				// Use relative URL since we're not using basePath
				const url = `/auth/verify?token=${token}`;
				console.log('Generated verification URL:', url);
				// Note: In Auth.js context, we can't easily get the baseUrl, so we'll use a fallback
				await sendVerificationEmail(user.email, url, 'http://localhost:5173');
			}
		}
	}
});
