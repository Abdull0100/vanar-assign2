import { json, type RequestHandler } from '@sveltejs/kit';
import { sendAccountDeletionEmail } from '$lib/email';
import { db } from '$lib/db';
import { users, sessions, accounts, chatMessages } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const { userId } = params;

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Prevent users from deleting themselves
		if (session.user.id === userId) {
			return json({ error: 'You cannot delete your own account' }, { status: 400 });
		}

		// Fetch the user before deletion to get their details for the email
		const [userToDelete] = await db.select().from(users).where(eq(users.id, userId as string));

		if (!userToDelete) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Delete related data first to handle foreign key constraints
		// Delete sessions (these don't have cascade delete)
		await db.delete(sessions).where(eq(sessions.userId, userId as string));
		
		// Delete accounts (these have cascade delete but we'll be explicit)
		await db.delete(accounts).where(eq(accounts.userId, userId as string));
		
		// Delete chat messages (these have cascade delete but we'll be explicit)
		await db.delete(chatMessages).where(eq(chatMessages.userId, userId as string));

		// Finally delete the user
		await db.delete(users).where(eq(users.id, userId as string));

		// Send deletion email notification
		if (userToDelete.email) {
			const adminName = session.user.name || session.user.email || "Administrator";
			await sendAccountDeletionEmail(
				userToDelete.email, 
				userToDelete.name || "User", 
				adminName
			);
		}

		return json({ message: 'User deleted successfully' });
	} catch (error) {
		console.error('Delete user error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
