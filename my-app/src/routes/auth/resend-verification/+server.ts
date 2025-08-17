import { json, fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendVerificationEmail, generateVerificationToken } from '$lib/utils/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Find the user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.email, email));

		if (!user) {
			return fail(404, { error: 'User not found' });
		}

		// Check if user is already verified
		if (user.verified) {
			return fail(400, { error: 'Email is already verified' });
		}

		// Check if user is an email/password user (not OAuth)
		if (user.provider !== 'email') {
			return fail(400, { error: 'OAuth users do not need email verification' });
		}

		// Check if there's already a valid verification token
		const [existingVerification] = await db
			.select()
			.from(emailVerifications)
			.where(
				and(
					eq(emailVerifications.userId, user.id),
					gt(emailVerifications.expiresAt, new Date())
				)
			);

		if (existingVerification) {
			return fail(400, { 
				error: 'A verification email was recently sent. Please check your inbox or wait a few minutes before requesting another.' 
			});
		}

		// Generate new verification token
		const verificationToken = generateVerificationToken();
		const verificationExpiresAt = new Date();
		verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24); // 24 hours

		// Delete any expired tokens for this user
		await db
			.delete(emailVerifications)
			.where(eq(emailVerifications.userId, user.id));

		// Insert new verification record
		await db.insert(emailVerifications).values({
			userId: user.id,
			token: verificationToken,
			expiresAt: verificationExpiresAt
		});

		// Send verification email
		const emailSent = await sendVerificationEmail(
			user.email, 
			user.name || 'User', 
			verificationToken
		);

		if (!emailSent) {
			return fail(500, { error: 'Failed to send verification email. Please try again.' });
		}

		console.log('✅ Verification email resent to:', user.email);

		return json({ 
			success: true, 
			message: 'Verification email sent successfully. Please check your inbox.' 
		});

	} catch (error) {
		console.error('❌ Error resending verification email:', error);
		return fail(500, { error: 'An error occurred. Please try again.' });
	}
};
