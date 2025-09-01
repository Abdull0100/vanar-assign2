import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, verificationTokens } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/email';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Check if user exists
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (!user) {
			// Don't reveal if user exists or not for security
			return json({ success: true, message: 'If an account exists, a reset link has been sent' });
		}

		// Generate reset token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour expiry

		// Store reset token
		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires
		});

		// Send reset email
		const resetUrl = `/auth/reset-password?token=${token}`;
		await sendPasswordResetEmail(email, resetUrl);

		return json({ success: true, message: 'Password reset link sent successfully' });
	} catch (error) {
		console.error('Password reset error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
