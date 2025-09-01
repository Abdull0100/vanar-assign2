import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { currentPassword, newPassword } = await request.json();

		if (!currentPassword || !newPassword) {
			return json({ error: 'Current password and new password are required' }, { status: 400 });
		}

		if (newPassword.length < 8) {
			return json({ error: 'New password must be at least 8 characters long' }, { status: 400 });
		}

		// Get user's current password hash
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id)
		});

		if (!user || !user.password) {
			return json({ error: 'User not found or no password set' }, { status: 404 });
		}

		// Verify current password
		const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
		if (!isCurrentPasswordValid) {
			return json({ error: 'Current password is incorrect' }, { status: 400 });
		}

		// Hash new password
		const hashedNewPassword = await bcrypt.hash(newPassword, 12);

		// Update password
		await db
			.update(users)
			.set({
				password: hashedNewPassword,
				updatedAt: new Date()
			})
			.where(eq(users.id, session.user.id));

		return json({ message: 'Password changed successfully' });
	} catch (error) {
		console.error('Change password error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
