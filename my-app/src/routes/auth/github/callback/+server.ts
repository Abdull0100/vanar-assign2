// src/routes/auth/github/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getDb } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function sessionExpiry() {
	const expires = new Date();
	expires.setDate(expires.getDate() + 7);
	return expires;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	console.log('🟢 GitHub OAuth callback route hit');

	const code = url.searchParams.get('code');
	if (!code) {
		console.error('❌ No authorization code received');
		return redirect(302, '/login?error=no_code');
	}

	try {
		// 1. Exchange code for token
		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: { Accept: 'application/json' },
			body: new URLSearchParams({
				client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
				client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
				code,
				redirect_uri: import.meta.env.VITE_GITHUB_REDIRECT_URI,
			}),
		});

		const tokenData = await tokenResponse.json();
		console.log("🔑 Token exchange response:", tokenData);

		if (tokenData.error) {
			console.error('❌ Token exchange failed:', tokenData);
			return redirect(302, '/login?error=token_exchange_failed');
		}

		const accessToken = tokenData.access_token;

		// 2. Get user info
		const userResponse = await fetch('https://api.github.com/user', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		const userData = await userResponse.json();
		console.log("👤 GitHub user data:", userData);

		if (!userData || !userData.id) {
			console.error("❌ Failed to fetch GitHub user profile");
			return redirect(302, '/login?error=user_fetch_failed');
		}

		// 3. Get emails
		const emailResponse = await fetch('https://api.github.com/user/emails', {
			headers: { Authorization: `Bearer ${accessToken}` },
		});
		const emails = await emailResponse.json();
		console.log("📧 GitHub emails:", emails);

		const primaryEmail = emails.find((email: any) => email.primary)?.email
			|| emails.find((email: any) => email.verified)?.email;

		if (!primaryEmail) {
			console.error("❌ No usable email found in GitHub response");
			return redirect(302, '/login?error=no_email');
		}

		// 4. Upsert user
		const db = getDb();
		let user = await db.query.users.findFirst({
			where: eq(users.email, primaryEmail),
		});

		if (!user) {
			console.log("🆕 Creating new user in DB:", primaryEmail);
			[user] = await db.insert(users).values({
				email: primaryEmail,
				name: userData.name ?? '',
				avatar: userData.avatar_url,
				provider: 'github',
				providerId: String(userData.id),
				verified: true, // OAuth users are automatically verified
				role: 'user', // Default role
				passwordHash: null // No password for OAuth users
			}).returning();
		} else {
			// Update existing user's OAuth info and ensure they're verified
			[user] = await db.update(users).set({
				provider: 'github',
				providerId: String(userData.id),
				verified: true, // Ensure OAuth users are verified
				avatar: userData.avatar_url,
				name: userData.name ?? user.name
			}).where(eq(users.id, user.id)).returning();
			
			console.log("✅ Existing user updated:", user.email);
		}

		// 5. Create session
		const expiresAt = sessionExpiry();
		const [session] = await db.insert(sessions).values({
			id: randomUUID(),
			userId: user.id,
			expiresAt,
		}).returning();

		console.log("🍪 Session created:", session);

		cookies.set('session', session.id, {
			httpOnly: true,
			path: '/',
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			expires: expiresAt,
		});

		console.log("🎉 GitHub OAuth login successful -> redirecting to /chat");
		return redirect(302, '/chat');

	} catch (err) {
		if (err instanceof Response || (err as any)?.status === 302) {
			throw err;
		}
		console.error("❌ OAuth callback exception:", err);
		return redirect(302, '/login?error=oauth_error');
	}
};
