import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, verificationTokens } from '$lib/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { token, password } = await request.json();

		if (!token || !password) {
			return json({ error: 'Token and password are required' }, { status: 400 });
		}

		if (password.length < 6) {
			return json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
		}

		// Find rand validate the reset token
		const resetToken = await db.query.verificationTokens.findFirst({
			where: and(eq(verificationTokens.token, token), gt(verificationTokens.expires, new Date()))
		});

		if (!resetToken) {
			return json({ error: 'Invalid or expired token' }, { status: 400 });
		}

		// Hash the new password
		const hashedPassword = await bcrypt.hash(password, 10);

		// Update user's password
		await db
			.update(users)
			.set({
				password: hashedPassword,
				updatedAt: new Date()
			})
			.where(eq(users.email, resetToken.identifier));

		// Delete the used token
		await db.delete(verificationTokens).where(eq(verificationTokens.token, token));

		return json({ success: true, message: 'Password reset successfully' });
	} catch (error) {
		console.error('Password reset error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
