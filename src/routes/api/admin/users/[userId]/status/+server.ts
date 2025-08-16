import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const { active } = await request.json();
		const { userId } = params;

		if (typeof active !== 'boolean') {
			return json({ error: 'Invalid active status' }, { status: 400 });
		}

		// For now, we'll use emailVerified as a proxy for active status
		// In a real app, you might want to add an 'active' field to the users table
		const updateData = active ? { emailVerified: new Date() } : { emailVerified: null };

		await db.update(users).set(updateData).where(eq(users.id, userId as string));

		return json({ message: 'User status updated successfully' });
	} catch (error) {
		console.error('Update user status error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
