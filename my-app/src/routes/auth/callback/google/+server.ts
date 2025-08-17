// src/routes/auth/callback/google/+server.ts
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function sessionExpiry() {
	const expires = new Date();
	expires.setDate(expires.getDate() + 7);
	return expires;
}

export const GET: RequestHandler = async ({ url, cookies }) => {
	console.log('🟢 [/auth/callback/google] Callback route accessed');
	console.log('🔹 Full callback URL:', url.toString());

	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		console.error('❌ Google returned error:', error);
		throw redirect(302, '/login?error=oauth_error');
	}

	if (!code) {
		console.error('❌ No authorization code received from Google');
		throw redirect(302, '/login?error=no_code');
	}

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
		console.error('❌ Missing Google OAuth config in .env');
		throw redirect(302, '/login?error=oauth_config_error');
	}

	try {
		// 1. Exchange code for tokens
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				client_id: env.GOOGLE_CLIENT_ID,
				client_secret: env.GOOGLE_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
				redirect_uri: env.GOOGLE_REDIRECT_URI
			})
		});

		const tokenData = await tokenResponse.json();
		console.log('🔑 Token response:', tokenData);

		if (!tokenResponse.ok || !tokenData.access_token) {
			console.error('❌ Token exchange failed:', tokenData);
			throw redirect(302, '/login?error=token_exchange_failed');
		}

		// 2. Fetch user profile
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { Authorization: `Bearer ${tokenData.access_token}` }
		});

		const userData = await userResponse.json();
		console.log('👤 Google user info:', userData);

		if (!userResponse.ok || !userData.email) {
			console.error('❌ Failed to fetch user info:', userData);
			throw redirect(302, '/login?error=user_info_failed');
		}

		// 3. Find or create user
		let user = await db.query.users.findFirst({
			where: eq(users.email, userData.email),
		});

		if (!user) {
			[user] = await db.insert(users).values({
				id: randomUUID(),
				email: userData.email,
				name: userData.name ?? '',
				avatar: userData.picture,
				provider: 'google',
				providerId: userData.id,
				verified: true,
				passwordHash: null // ✅ No password for OAuth users
			}).returning();

			console.log('✅ New user created:', user.email);
		} else {
			console.log('✅ Existing user found:', user.email);
		}

		// 4. Create session
		const expiresAt = sessionExpiry();
		const [session] = await db.insert(sessions).values({
			id: randomUUID(),
			userId: user.id,
			expiresAt,
		}).returning();

		cookies.set('session', session.id, { // ✅ unified cookie name
			path: '/',
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			expires: expiresAt
		});

		console.log('🎉 Google login successful, session created:', session.id);
		throw redirect(302, '/');

	} catch (err) {
		// ✅ If it's a redirect, just rethrow it (not an error)
		if (err instanceof Response && err.status === 302) {
			throw err;
		}

		console.error('❌ OAuth callback exception:', err);
		throw redirect(302, '/login?error=oauth_callback_failed');
	}
}