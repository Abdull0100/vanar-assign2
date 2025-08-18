import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq, and, lt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const otp = formData.get('otp') as string;
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;

		if (!email || !otp || !password || !confirmPassword) {
			return fail(400, { error: 'All fields are required' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters long' });
		}

		const db = getDb();
		
		console.log('🔍 OTP Verification Debug:');
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

		// Find reset record with OTP
		const [resetRecord] = await db
			.select()
			.from(passwordResets)
			.where(and(
				eq(passwordResets.userId, user.id),
				eq(passwordResets.token, otp)
			));

		console.log('🔍 Reset record found:', !!resetRecord);
		if (resetRecord) {
			console.log('🔍 Stored OTP:', resetRecord.token);
			console.log('🔍 OTP expires at:', resetRecord.expiresAt);
		}

		// If no reset record found, let's check what OTPs exist for this user
		if (!resetRecord) {
			console.log('❌ No reset record found for OTP:', otp);
			
			// Check all reset records for this user
			const allUserResets = await db
				.select()
				.from(passwordResets)
				.where(eq(passwordResets.userId, user.id));
			
			console.log('🔍 All reset records for user:', allUserResets.length);
			allUserResets.forEach((reset, index) => {
				console.log(`🔍 Reset ${index + 1}:`, {
					token: reset.token,
					expiresAt: reset.expiresAt,
					createdAt: reset.createdAt
				});
			});
			
			return fail(400, { error: 'Invalid or expired OTP' });
		}

		// Check if OTP is expired
		if (resetRecord.expiresAt < new Date()) {
			// Clean up expired OTP
			await db
				.delete(passwordResets)
				.where(eq(passwordResets.token, otp));
			return fail(400, { error: 'OTP has expired' });
		}

		try {
			// Hash the new password
			const passwordHash = await bcrypt.hash(password, 10);
			console.log('✅ Password hashed successfully');

			// Update user's password
			await db
				.update(users)
				.set({ passwordHash, updatedAt: new Date() })
				.where(eq(users.id, user.id));
			console.log('✅ User password updated successfully');

			// Delete the used OTP
			await db
				.delete(passwordResets)
				.where(eq(passwordResets.token, otp));
			console.log('✅ OTP deleted successfully');

			console.log('✅ Password reset completed successfully, redirecting...');
			
		} catch (error) {
			console.error('❌ Error resetting password with OTP:', error);
			return fail(500, { error: 'An error occurred while resetting your password' });
		}

		// Redirect after successful password reset (outside try-catch)
		return redirect(302, '/login?reset=success');
	}
};
