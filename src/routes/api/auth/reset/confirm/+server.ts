import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { passwordResetTokens, users } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { ValidationError, handleApiError } from '$lib/errors';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token, password } = await request.json();

		if (!token || typeof token !== 'string') {
			throw new ValidationError('Reset token is required');
		}

		if (!password || typeof password !== 'string' || password.length < 8) {
			throw new ValidationError('Password must be at least 8 characters long');
		}

		// Find and validate reset token
		const resetToken = await db.query.passwordResetTokens.findFirst({
			where: and(
				eq(passwordResetTokens.token, token),
				gt(passwordResetTokens.expires, new Date())
			)
		});

		if (!resetToken) {
			return json({ 
				error: 'Invalid or expired reset token. Please request a new password reset.' 
			}, { status: 400 });
		}

		// Hash new password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Update user password
		await db.update(users)
			.set({ 
				password: hashedPassword,
				updatedAt: new Date()
			})
			.where(eq(users.email, resetToken.email));

		// Delete the used reset token
		await db.delete(passwordResetTokens).where(eq(passwordResetTokens.token, token));

		return json({ 
			message: 'Password has been reset successfully. You can now sign in with your new password.' 
		});

	} catch (error) {
		handleApiError(error);
	}
};
