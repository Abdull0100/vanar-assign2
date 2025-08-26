import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { chatMessages, users, conversations } from '$lib/db/schema';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		const session = await locals.getSession();
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch chat messages with user and conversation data
		const messagesData = await db.query.chatMessages.findMany({
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true
					}
				},
				conversation: {
					columns: {
						id: true,
						roomName: true
					}
				}
			},
			orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)]
		});

		return json({
			messages: messagesData
		});
	} catch (error) {
		console.error('Error fetching chat messages:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
