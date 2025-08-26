import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { conversations, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		const session = await locals.getSession();
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch conversations with user data
		const conversationsData = await db.query.conversations.findMany({
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			orderBy: (conversations, { desc }) => [desc(conversations.createdAt)]
		});

		return json({
			conversations: conversationsData
		});
	} catch (error) {
		console.error('Error fetching conversations:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
