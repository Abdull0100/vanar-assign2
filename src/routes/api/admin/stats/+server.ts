import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, chatMessages } from '$lib/db/schema';
import { eq, count } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Admin access required' }, { status: 403 });
		}

		// Get total users count
		const totalUsersResult = await db.select({ count: count() }).from(users);
		const totalUsers = totalUsersResult[0]?.count || 0;

		// Get admin count
		const adminUsersResult = await db
			.select({ count: count() })
			.from(users)
			.where(eq(users.role, 'admin'));
		const adminUsers = adminUsersResult[0]?.count || 0;

		// Get total chat messages count
		const totalMessagesResult = await db.select({ count: count() }).from(chatMessages);
		const totalMessages = totalMessagesResult[0]?.count || 0;

		// Get recent user registrations (last 30 days)
		const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
		const recentUsersResult = await db.select({ count: count() }).from(users);
		const recentUsers = recentUsersResult[0]?.count || 0;

		return json({
			totalUsers,
			adminUsers,
			totalMessages,
			recentUsers,
			systemStatus: 'online'
		});
	} catch (error) {
		console.error('Stats API error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
