import { json, fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { sendVerificationOTP, generateOTP } from '$lib/utils/email';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { email } = await request.json();

		if (!email) {
			return fail(400, { error: 'Email is required' });
		}

		// Find the user
		const [user] = await getDb()
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

		// Check if there's already a valid verification OTP
		const [existingVerification] = await getDb()
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
				error: 'A verification OTP was recently sent. Please check your inbox or wait a few minutes before requesting another.' 
			});
		}

		// Generate new verification OTP
		const otp = generateOTP();
		const verificationExpiresAt = new Date();
		verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 1); // 1 hour

		// Delete any expired tokens for this user
		await getDb()
			.delete(emailVerifications)
			.where(eq(emailVerifications.userId, user.id));

		// Insert new verification record with OTP
		await getDb().insert(emailVerifications).values({
			userId: user.id,
			token: otp, // Store OTP as token
			expiresAt: verificationExpiresAt
		});

		// Send verification OTP email
		const emailSent = await sendVerificationOTP(
			user.email, 
			user.name || 'User', 
			otp
		);

		if (!emailSent) {
			return fail(500, { error: 'Failed to send verification OTP. Please try again.' });
		}

		console.log('✅ Verification OTP resent to:', user.email);

		return json({ 
			success: true, 
			message: 'Verification OTP sent successfully. Please check your inbox.' 
		});

	} catch (error) {
		console.error('❌ Error resending verification OTP:', error);
		return fail(500, { error: 'An error occurred. Please try again.' });
	}
};
