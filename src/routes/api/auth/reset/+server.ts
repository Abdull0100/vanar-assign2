import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { passwordResetTokens, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail } from '$lib/email';
import { ValidationError, handleApiError } from '$lib/errors';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email || typeof email !== 'string') {
			throw new ValidationError('Valid email address is required');
		}

		// Check if user exists
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user) {
			// Don't reveal if user exists or not for security
			return json({ 
				message: 'If an account with that email exists, a password reset link has been sent.' 
			});
		}

		// Generate secure token
		const token = crypto.randomBytes(32).toString('hex');
		const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

		// Delete any existing reset tokens for this email
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.email, email));

		// Save new reset token
		await db.insert(passwordResetTokens).values({
			email,
			token,
			expires
		});

		// Send password reset email
		const emailSent = await sendPasswordResetEmail(email, token);
		
		if (!emailSent) {
			console.error('Failed to send password reset email to:', email);
			return json({ 
				error: 'Failed to send password reset email. Please try again later.' 
			}, { status: 500 });
		}

		return json({ 
			message: 'If an account with that email exists, a password reset link has been sent.' 
		});

	} catch (error) {
		handleApiError(error);
	}
};
