import { json } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	try {
		if (!locals.user) {
			return json({ error: 'Not logged in' }, { status: 401 });
		}

		const db = getDb();
		
		// Update current user to admin
		await db.update(users)
			.set({ 
				role: 'admin',
				updatedAt: new Date()
			})
			.where(eq(users.id, locals.user.id));

		return json({ 
			success: true, 
			message: 'You are now an admin! You can access /admin now.',
			user: {
				...locals.user,
				role: 'admin'
			}
		});

	} catch (error) {
		console.error('Error making user admin:', error);
		return json({ error: 'Failed to make user admin' }, { status: 500 });
	}
};
