import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, chatMessages, accounts, sessions } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { password, confirmDeletion } = await request.json();

		if (!password || confirmDeletion !== 'DELETE') {
			return json({ error: 'Password and confirmation are required' }, { status: 400 });
		}

		// Get user's current password hash
		const user = await db.query.users.findFirst({
			where: eq(users.id, session.user.id)
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Verify password if user has one (OAuth users might not have password)
		if (user.password) {
			const isPasswordValid = await bcrypt.compare(password, user.password);
			if (!isPasswordValid) {
				return json({ error: 'Password is incorrect' }, { status: 400 });
			}
		}

		// Delete user data in order (foreign key constraints)
		// 1. Delete chat messages
		await db.delete(chatMessages).where(eq(chatMessages.userId, session.user.id));

		// 2. Delete sessions
		await db.delete(sessions).where(eq(sessions.userId, session.user.id));

		// 3. Delete accounts
		await db.delete(accounts).where(eq(accounts.userId, session.user.id));

		// 4. Finally delete user
		await db.delete(users).where(eq(users.id, session.user.id));

		return json({ message: 'Account deleted successfully' });
	} catch (error) {
		console.error('Delete account error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
