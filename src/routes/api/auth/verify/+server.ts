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

		// Find the verification token
		const verificationToken = await db.query.verificationTokens.findFirst({
			where: and(eq(verificationTokens.token, token), gt(verificationTokens.expires, new Date()))
		});

		if (!verificationToken) {
			return json({ error: 'Invalid or expired token' }, { status: 400 });
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
