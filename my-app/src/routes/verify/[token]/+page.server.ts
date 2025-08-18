import { redirect, error } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const { token } = params;

	if (!token) {
		throw error(400, 'Invalid verification token');
	}

	try {
		// Find the verification token
		const [verification] = await getDb()
			.select()
			.from(emailVerifications)
			.where(
				and(
					eq(emailVerifications.token, token),
					gt(emailVerifications.expiresAt, new Date())
				)
			);

		if (!verification) {
			// Check if token exists but is expired
			const [expiredVerification] = await getDb()
				.select()
				.from(emailVerifications)
				.where(eq(emailVerifications.token, token));

			if (expiredVerification) {
				return {
					status: 'expired',
					message: 'Verification link has expired. Please request a new one.',
					userId: expiredVerification.userId
				};
			}

			return {
				status: 'invalid',
				message: 'Invalid verification link. Please check your email and try again.'
			};
		}

		// Get the user
		const [user] = await getDb()
			.select()
			.from(users)
			.where(eq(users.id, verification.userId));

		if (!user) {
			return {
				status: 'error',
				message: 'User not found. Please contact support.'
			};
		}

		// Check if user is already verified
		if (user.verified) {
			return {
				status: 'already_verified',
				message: 'Your email is already verified. You can now log in.',
				user: {
					name: user.name,
					email: user.email
				}
			};
		}

		// Mark user as verified
		await getDb()
			.update(users)
			.set({ verified: true })
			.where(eq(users.id, user.id));

		// Delete the verification token
		await getDb()
			.delete(emailVerifications)
			.where(eq(emailVerifications.token, token));

		console.log('✅ Email verified for user:', user.email);

		// Redirect to login with success message
		throw redirect(302, '/login?verified=true');

	} catch (err) {
		if (err instanceof Response) {
			throw err;
		}
		
		console.error('❌ Error during email verification:', err);
		return {
			status: 'error',
			message: 'An error occurred during verification. Please try again.'
		};
	}
};
