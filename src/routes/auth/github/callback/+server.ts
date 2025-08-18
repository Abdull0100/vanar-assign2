import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users, sessions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function sessionExpiry() {
	const expires = new Date();
	expires.setDate(expires.getDate() + 7);
	return expires;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	console.log('🟢 [/auth/github/callback] Callback route accessed');
	console.log('🔹 Full callback URL:', url.toString());

	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		console.error('❌ GitHub returned error:', error);
		throw redirect(302, '/auth/signin?error=oauth_error');
	}

	if (!code) {
		console.error('❌ No authorization code received from GitHub');
		throw redirect(302, '/auth/signin?error=no_code');
	}

	try {
		// Exchange code for access token
		const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
			method: 'POST',
			headers: {
				'Accept': 'application/json',
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
				client_secret: import.meta.env.VITE_GITHUB_CLIENT_SECRET,
				code: code,
				redirect_uri: import.meta.env.VITE_GITHUB_REDIRECT_URI,
			}),
		});

		const tokenData = await tokenResponse.json();
		console.log('🔑 Token response:', tokenData);
		
		if (tokenData.error) {
			console.error('❌ Token exchange failed:', tokenData.error);
			throw redirect(302, `/auth/signin?error=${tokenData.error}`);
		}

		// Get user information
		const userResponse = await fetch('https://api.github.com/user', {
			headers: {
				'Authorization': `Bearer ${tokenData.access_token}`,
				'Accept': 'application/vnd.github.v3+json',
			},
		});

		const userData = await userResponse.json();
		console.log('👤 GitHub user info:', userData);
		
		if (!userResponse.ok || !userData.login) {
			console.error('❌ Failed to fetch user info:', userData);
			throw redirect(302, '/auth/signin?error=user_info_failed');
		}

		// Get user email
		const emailResponse = await fetch('https://api.github.com/user/emails', {
			headers: {
				'Authorization': `Bearer ${tokenData.access_token}`,
				'Accept': 'application/vnd.github.v3+json',
			},
		});

		const emails = await emailResponse.json();
		const primaryEmail = emails.find((email: any) => email.primary)?.email;

		if (!primaryEmail) {
			console.error('❌ No primary email found');
			throw redirect(302, '/auth/signin?error=no_email');
		}

		// Find or create user
		let user = await db.query.users.findFirst({
			where: eq(users.email, primaryEmail),
		});

		if (!user) {
			[user] = await db.insert(users).values({
				id: randomUUID(),
				email: primaryEmail,
				name: userData.name || userData.login,
				image: userData.avatar_url,
				emailVerified: new Date(),
				password: null // No password for OAuth users
			}).returning();

			console.log('✅ New user created:', user.email);
		} else {
			// Update existing user info
			await db.update(users)
				.set({
					name: userData.name || userData.login || user.name,
					image: userData.avatar_url || user.image,
					emailVerified: new Date()
				})
				.where(eq(users.id, user.id));
			console.log('✅ Existing user found:', user.email);
		}

		// Create session
		const expiresAt = sessionExpiry();
		const sessionToken = randomUUID();
		const [session] = await db.insert(sessions).values({
			sessionToken,
			userId: user.id,
			expires: expiresAt,
		}).returning();

		cookies.set('next-auth.session-token', sessionToken, {
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			expires: expiresAt
		});

		console.log('🎉 GitHub login successful, session created:', sessionToken);
		throw redirect(302, '/dashboard');
		
	} catch (err) {
		// If it's a redirect, just rethrow it (not an error)
		if (err instanceof Response && err.status === 302) {
			throw err;
		}
		
		console.error('❌ GitHub OAuth error:', err);
		throw redirect(302, '/auth/signin?error=oauth_callback_failed');
	}
};
