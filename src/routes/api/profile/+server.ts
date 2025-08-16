import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		const { name } = await request.json();

		if (!name || typeof name !== 'string') {
			return json({ error: 'Name is required' }, { status: 400 });
		}

		// Update user profile
		await db
			.update(users)
			.set({ name, updatedAt: new Date() })
			.where(eq(users.id, session.user.id));

		return json({ message: 'Profile updated successfully' });
	} catch (error) {
		console.error('Update profile error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
}
