import { json, type RequestHandler } from '@sveltejs/kit';
import { ActivityTracker } from '$lib/activityTracker';
import { db } from '$lib/db';
import { users, userStats } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, request }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get all users with their stats
		const allUsers = await db.select().from(users).orderBy(users.createdAt);
		
		// Get user stats for each user
		const allUsersWithStats = await Promise.all(
			allUsers.map(async (user) => {
				const stats = await db.select().from(userStats).where(eq(userStats.userId, user.id)).limit(1);
				return {
					...user,
					userStats: stats
				};
			})
		);

		// Get overall system statistics
		const totalUsers = allUsersWithStats.length;
		const verifiedUsers = allUsersWithStats.filter(u => u.emailVerified).length;
		const adminUsers = allUsersWithStats.filter(u => u.role === 'admin').length;
		const regularUsers = allUsersWithStats.filter(u => u.role === 'user').length;

		// Calculate chat statistics
		const totalChatMessages = allUsersWithStats.reduce((sum, user) => 
			sum + (user.userStats?.[0]?.totalChatMessages || 0), 0
		);
		const totalConversations = allUsersWithStats.reduce((sum, user) => 
			sum + (user.userStats?.[0]?.totalConversations || 0), 0
		);

		// Get most active users
		const mostActiveUsers = allUsersWithStats
			.filter(user => user.userStats?.[0])
			.sort((a, b) => (b.userStats[0]?.totalChatMessages || 0) - (a.userStats[0]?.totalChatMessages || 0))
			.slice(0, 10);

		// Get recent activity
		const recentActivity = await ActivityTracker.getAdminActions(20);

		return json({
			overview: {
				totalUsers,
				verifiedUsers,
				adminUsers,
				regularUsers,
				totalChatMessages,
				totalConversations
			},
			mostActiveUsers: mostActiveUsers.map(user => ({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				stats: user.userStats?.[0] || null
			})),
			recentActivity,
			userStats: allUsersWithStats.map(user => ({
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				emailVerified: user.emailVerified,
				createdAt: user.createdAt,
				stats: user.userStats?.[0] || null
			}))
		});
	} catch (error) {
		console.error('Get user stats error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
