import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';

import { verificationTokens } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token } = await request.json();

		if (!token) {
			return json({ error: 'Token is required' }, { status: 400 });
		}

		// Find and validate the reset token
		const resetToken = await db.query.verificationTokens.findFirst({
			where: and(eq(verificationTokens.token, token), gt(verificationTokens.expires, new Date()))
		});

		if (!resetToken) {
			return json({ error: 'Invalid or expired token' }, { status: 400 });
		}

		return json({ success: true, message: 'Token is valid' });
	} catch (error) {
		console.error('Token validation error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
