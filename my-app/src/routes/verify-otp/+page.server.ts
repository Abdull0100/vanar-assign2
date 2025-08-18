import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const otp = formData.get('otp') as string;

		if (!email || !otp) {
			return fail(400, { error: 'Email and OTP are required' });
		}

		const db = getDb();
		
		console.log('🔍 Email Verification OTP Debug:');
		console.log('📧 Email:', email);
		console.log('🔢 OTP entered:', otp);
		console.log('🔢 OTP type:', typeof otp);
		console.log('🔢 OTP length:', otp?.length);
		console.log('🔢 OTP trimmed:', otp?.trim());
		
		// Find user by email
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user) {
			console.log('❌ User not found for email:', email);
			return fail(400, { error: 'Invalid email or OTP' });
		}

		console.log('✅ User found:', user.email);
		console.log('✅ User verified status:', user.verified);

		// Check if user is already verified
		if (user.verified) {
			return fail(400, { error: 'Email is already verified. You can now log in.' });
		}

		// Find verification record with OTP
		const [verificationRecord] = await db
			.select()
			.from(emailVerifications)
			.where(and(
				eq(emailVerifications.userId, user.id),
				eq(emailVerifications.token, otp)
			));

		console.log('🔍 Verification record found:', !!verificationRecord);
		if (verificationRecord) {
			console.log('🔍 Stored OTP:', verificationRecord.token);
			console.log('🔍 OTP expires at:', verificationRecord.expiresAt);
		}

		// If no verification record found, let's check what OTPs exist for this user
		if (!verificationRecord) {
			console.log('❌ No verification record found for OTP:', otp);
			
			// Check all verification records for this user
			const allUserVerifications = await db
				.select()
				.from(emailVerifications)
				.where(eq(emailVerifications.userId, user.id));
			
			console.log('🔍 All verification records for user:', allUserVerifications.length);
			allUserVerifications.forEach((verification, index) => {
				console.log(`🔍 Verification ${index + 1}:`, {
					token: verification.token,
					expiresAt: verification.expiresAt,
					createdAt: verification.createdAt
				});
			});
			
			return fail(400, { error: 'Invalid or expired OTP' });
		}

		// Check if OTP is expired
		if (verificationRecord.expiresAt < new Date()) {
			// Clean up expired OTP
			await db
				.delete(emailVerifications)
				.where(eq(emailVerifications.token, otp));
			return fail(400, { error: 'OTP has expired. Please request a new one.' });
		}

		try {
			// Mark user as verified
			await db
				.update(users)
				.set({ verified: true })
				.where(eq(users.id, user.id));
			console.log('✅ User verified successfully');

			// Delete the used OTP
			await db
				.delete(emailVerifications)
				.where(eq(emailVerifications.token, otp));
			console.log('✅ OTP deleted successfully');

			console.log('✅ Email verification completed successfully, redirecting...');
			
		} catch (error) {
			console.error('❌ Error verifying email with OTP:', error);
			return fail(500, { error: 'An error occurred while verifying your email' });
		}

		// Redirect after successful verification (outside try-catch)
		return redirect(302, '/login?verified=true');
	}
};
