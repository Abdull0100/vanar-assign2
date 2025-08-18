import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, sessions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';

function sessionExpiry() {
	const expires = new Date();
	expires.setDate(expires.getDate() + 7);
	return expires;
}

export async function GET({ url, cookies }) {
	console.log('🟢 [/api/auth/callback/google] Callback route accessed');
	console.log('🔹 Full callback URL:', url.toString());

	const code = url.searchParams.get('code');
	const error = url.searchParams.get('error');

	if (error) {
		console.error('❌ Google returned error:', error);
		throw redirect(302, '/auth/signin?error=oauth_error');
	}

	if (!code) {
		console.error('❌ No authorization code received from Google');
		throw redirect(302, '/auth/signin?error=no_code');
	}

	if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET || !env.GOOGLE_REDIRECT_URI) {
		console.error('❌ Missing Google OAuth config in .env');
		console.error('❌ Config check:', {
			clientId: !!env.GOOGLE_CLIENT_ID,
			clientSecret: !!env.GOOGLE_CLIENT_SECRET,
			redirectUri: !!env.GOOGLE_REDIRECT_URI
		});
		throw redirect(302, '/auth/signin?error=oauth_config_error');
	}
	
	console.log('✅ OAuth config loaded:', {
		clientId: env.GOOGLE_CLIENT_ID?.substring(0, 20) + '...',
		redirectUri: env.GOOGLE_REDIRECT_URI
	});

	try {
		// 1. Exchange code for tokens
		console.log('🔄 Exchanging code for token...');
		console.log('🔑 Token request params:', {
			client_id: env.GOOGLE_CLIENT_ID,
			code: code.substring(0, 20) + '...',
			redirect_uri: env.GOOGLE_REDIRECT_URI
		});
		
		const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
			method: 'POST',
			headers: { 
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			body: new URLSearchParams({
				client_id: env.GOOGLE_CLIENT_ID,
				client_secret: env.GOOGLE_CLIENT_SECRET,
				code,
				grant_type: 'authorization_code',
				redirect_uri: env.GOOGLE_REDIRECT_URI
			})
		});

		console.log('🔑 Token response status:', tokenResponse.status);
		console.log('🔑 Token response headers:', Object.fromEntries(tokenResponse.headers.entries()));
		
		const tokenData = await tokenResponse.json();
		console.log('🔑 Token response data:', tokenData);

		if (!tokenResponse.ok || !tokenData.access_token) {
			console.error('❌ Token exchange failed:', tokenData);
			throw redirect(302, '/auth/signin?error=token_exchange_failed');
		}

		// 2. Fetch user profile
		console.log('🔄 Fetching user profile...');
		const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
			headers: { 
				Authorization: `Bearer ${tokenData.access_token}`
			}
		});

		const userData = await userResponse.json();
		console.log('👤 Google user info:', userData);

		if (!userResponse.ok || !userData.email) {
			console.error('❌ Failed to fetch user info:', userData);
			throw redirect(302, '/auth/signin?error=user_info_failed');
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
				image: userData.picture,
				emailVerified: new Date(),
				role: 'user', // Set default role
				password: null // No password for OAuth users
			}).returning();

			console.log('✅ New user created:', user.email);
		} else {
			// Update existing user info and ensure role is set
			await db.update(users)
				.set({
					name: userData.name || user.name,
					image: userData.picture || user.image,
					emailVerified: new Date(),
					role: user.role || 'user' // Ensure role is set
				})
				.where(eq(users.id, user.id));
			console.log('✅ Existing user found:', user.email);
		}

		// 4. Create session
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

		console.log('🎉 Google login successful, session created:', sessionToken);
		throw redirect(302, '/dashboard');

	} catch (err) {
		// If it's a redirect, just rethrow it (not an error)
		if (err instanceof Response && err.status === 302) {
			throw err;
		}
		
		console.error('❌ Google OAuth error:', err);
		
		// Type-safe error handling
		const error = err as Error;
		console.error('❌ Error details:', {
			name: error.name,
			message: error.message,
			cause: error.cause,
			stack: error.stack
		});
		
		// Check if it's a network timeout
		if ((error.cause as any)?.code === 'ETIMEDOUT' || error.message?.includes('timeout')) {
			throw redirect(302, '/auth/signin?error=network_timeout');
		}
		
		throw redirect(302, '/auth/signin?error=oauth_callback_failed');
	}
}
