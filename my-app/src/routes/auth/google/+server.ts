// src/routes/auth/google/+server.ts
import { env } from '$env/dynamic/private';
import { redirect } from '@sveltejs/kit';

export async function GET() {
	console.log('🔹 [/auth/google] OAuth start route accessed');
	
	const clientId = env.GOOGLE_CLIENT_ID;
	const redirectUri = env.GOOGLE_REDIRECT_URI;
	
	console.log('🔹 Environment variables:', { 
		GOOGLE_CLIENT_ID: clientId ? 'SET' : 'MISSING',
		GOOGLE_REDIRECT_URI: redirectUri ? 'SET' : 'MISSING'
	});

	if (!clientId || !redirectUri) {
		console.error('❌ Missing Google OAuth config');
		throw redirect(302, '/login?error=oauth_config_missing');
	}

	const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid+email+profile&access_type=offline&prompt=consent`;
	
	console.log('🔹 Redirecting user to Google:', googleAuthUrl);
	throw redirect(302, googleAuthUrl);
}
