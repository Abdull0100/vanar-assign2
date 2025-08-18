import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, verificationTokens } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendVerificationEmail } from '$lib/email';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return json({ error: 'Email is required' }, { status: 400 });
		}

		// Find user by email
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Check if email is already verified
		if (user.emailVerified) {
			return json({ error: 'Email is already verified' }, { status: 400 });
		}

		// Remove any existing tokens for this email before issuing a new one
		await db.delete(verificationTokens).where(eq(verificationTokens.identifier, email));

		// Generate new verification token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires
		});

		// Send verification email with domain
		const url = `/auth/verify?token=${token}`;
		const baseUrl = request.headers.get('origin') || 'http://localhost:5173';
		await sendVerificationEmail(email, url, baseUrl);

		return json({
			success: true,
			message: 'Verification email sent successfully'
		});
	} catch (error) {
		console.error('Resend verification error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
