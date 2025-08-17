import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, verificationTokens } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ error: 'Token is required' }, { status: 400 });
		}

		console.log('Verification attempt with token:', token);

		// Find the verification token
		const verificationTokenResult = await db.select().from(verificationTokens).where(
			and(eq(verificationTokens.token, token), gt(verificationTokens.expires, new Date()))
		).limit(1);

		const verificationToken = verificationTokenResult[0];
		console.log('Found verification token:', verificationToken);

		if (!verificationToken) {
			// Check if token exists but is expired
			const expiredTokenResult = await db.select().from(verificationTokens).where(
				eq(verificationTokens.token, token)
			).limit(1);
			
			const expiredToken = expiredTokenResult[0];
			if (expiredToken) {
				console.log('Token found but expired:', expiredToken);
				return json({ error: 'Token has expired. Please request a new verification email.' }, { status: 400 });
			}
			
			console.log('No token found in database');
			return json({ error: 'Invalid token' }, { status: 400 });
		}

		// Update user's emailVerified field
		await db
			.update(users)
			.set({ emailVerified: new Date() })
			.where(eq(users.email, verificationToken.identifier));

		// Delete the used token
		await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

		return json({ success: true, message: 'Email verified successfully' });
	} catch (error) {
		console.error('Email verification error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
