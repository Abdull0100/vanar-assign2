import { json, type RequestHandler } from '@sveltejs/kit';
import { ActivityTracker } from '$lib/activityTracker';
import { db } from '$lib/db';
import { users, userSessions, chatMessages, conversations } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
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

		// Get user details
		const user = await db.query.users.findFirst({
			where: eq(users.id, userId)
		});

		if (!user) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Get user activities
		const activities = await ActivityTracker.getUserActivities(userId, 100);

		// Get user sessions
		const sessions = await ActivityTracker.getUserSessions(userId, 50);

		// Get user stats
		const stats = await ActivityTracker.getUserStats(userId);

		// Get user's chat messages count
		const userChatMessages = await db.select().from(chatMessages).where(eq(chatMessages.userId, userId)).limit(100);

		// Get user's conversations
		const userConversations = await db.select().from(conversations).where(eq(conversations.userId, userId)).limit(50);

		return json({
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				updatedAt: user.updatedAt
			},
			stats,
			activities,
			sessions,
			chatMessages: userChatMessages.map(msg => ({
				id: msg.id,
				content: msg.content,
				userId: msg.userId,
				role: msg.role,
				createdAt: msg.createdAt
			})),
			conversations: userConversations.map(conv => ({
				id: conv.id,
				roomName: conv.roomName,
				summary: conv.summary,
				createdAt: conv.createdAt,
				updatedAt: conv.updatedAt
			}))
		});
	} catch (error) {
		console.error('Get user activities error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
