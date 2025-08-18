import { redirect, error, fail } from '@sveltejs/kit';
import { dbClient } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	if (!token) {
		throw error(400, 'Invalid reset token');
	}

	try {
		// Find the reset token
		const [resetRecord] = await dbClient
			.select()
			.from(passwordResets)
			.where(
				and(
					eq(passwordResets.token, token),
					gt(passwordResets.expiresAt, new Date())
				)
			);

		if (!resetRecord) {
			// Check if token exists but is expired
			const [expiredReset] = await dbClient
				.select()
				.from(passwordResets)
				.where(eq(passwordResets.token, token));

			if (expiredReset) {
				return {
					status: 'expired',
					message: 'Password reset link has expired. Please request a new one.'
				};
			}

			return {
				status: 'invalid',
				message: 'Invalid reset link. Please check your email and try again.'
			};
		}

		// Get the user
		const [user] = await dbClient
			.select()
			.from(users)
			.where(eq(users.id, resetRecord.userId));

		if (!user) {
			return {
				status: 'error',
				message: 'User not found. Please contact support.'
			};
		}

		return {
			status: 'valid',
			token,
			user: {
				email: user.email,
				name: user.name
			}
		};

	} catch (err) {
		console.error('❌ Error during password reset validation:', err);
		return {
			status: 'error',
			message: 'An error occurred. Please try again.'
		};
	}
};

export const actions = {
	reset: async ({ request, params }) => {
		const formData = await request.formData();
		const password = formData.get('password') as string;
		const confirmPassword = formData.get('confirmPassword') as string;
		const { token } = params;

		if (!token) {
			return fail(400, { error: 'Invalid reset token' });
		}

		if (!password || !confirmPassword) {
			return fail(400, { error: 'Password and confirmation are required' });
		}

		if (password.length < 6) {
			return fail(400, { error: 'Password must be at least 6 characters long' });
		}

		if (password !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match' });
		}

		try {
			// Find the reset token
			const [resetRecord] = await dbClient
				.select()
				.from(passwordResets)
				.where(
					and(
						eq(passwordResets.token, token),
						gt(passwordResets.expiresAt, new Date())
					)
				);

			if (!resetRecord) {
				return fail(400, { error: 'Invalid or expired reset token' });
			}

			// Hash the new password
			const passwordHash = await bcrypt.hash(password, 10);

			// Update user's password
			await dbClient
				.update(users)
				.set({ passwordHash })
				.where(eq(users.id, resetRecord.userId));

			// Delete the reset token
			await dbClient
				.delete(passwordResets)
				.where(eq(passwordResets.token, token));

			console.log('✅ Password reset successful for user:', resetRecord.userId);

			// Redirect to login with success message
			throw redirect(302, '/login?reset=success');

		} catch (err) {
			if (err instanceof Response) {
				throw err;
			}
			
			console.error('❌ Error during password reset:', err);
			return fail(500, { error: 'An error occurred. Please try again.' });
		}
	}
};
