import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { users, userStats, userActivities, adminActions, conversations } from '$lib/db/schema';
import { eq, gte, desc, sql } from 'drizzle-orm';

export const GET: RequestHandler = async () => {
	try {
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
		const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

		// Get total users
		const totalUsers = await db.select({ count: sql<number>`count(*)` }).from(users);

		// Get today's conversations
		const todayConversations = await db
			.select({ count: sql<number>`count(*)` })
			.from(conversations)
			.where(gte(conversations.createdAt, today));

		// Get today's logins (from user activities)
		const todayLogins = await db
			.select({ count: sql<number>`count(*)` })
			.from(userActivities)
			.where(
				sql`${userActivities.activityType} = 'login' AND ${userActivities.createdAt} >= ${today}`
			);

		// Get total activities
		const totalActivities = await db.select({ count: sql<number>`count(*)` }).from(userActivities);
		const totalAdminActions = await db.select({ count: sql<number>`count(*)` }).from(adminActions);

		// Get new users this week
		const newUsersThisWeek = await db
			.select({ count: sql<number>`count(*)` })
			.from(users)
			.where(gte(users.createdAt, weekAgo));

		// Get active sessions (sessions without logout time)
		const activeSessions = await db
			.select({ count: sql<number>`count(*)` })
			.from(userActivities)
			.where(
				sql`${userActivities.activityType} = 'login' AND ${userActivities.createdAt} >= ${weekAgo}`
			);

		// Get conversations trend for last 7 days
		const conversationsTrend = [];
		for (let i = 6; i >= 0; i--) {
			const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
			const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);

			const dayConversations = await db
				.select({ count: sql<number>`count(*)` })
				.from(conversations)
				.where(
					sql`${conversations.createdAt} >= ${date} AND ${conversations.createdAt} < ${nextDate}`
				);

			conversationsTrend.push({
				date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
				count: dayConversations[0]?.count || 0
			});
		}

		// Get activity breakdown
		const activityBreakdown = [
			{ type: 'Chat Messages', count: 0, color: '#3B82F6' },
			{ type: 'Profile Updates', count: 0, color: '#10B981' },
			{ type: 'Password Changes', count: 0, color: '#F59E0B' },
			{ type: 'Admin Actions', count: totalAdminActions[0]?.count || 0, color: '#8B5CF6' }
		];

		// Get user stats for breakdown
		const allUserStats = await db.select().from(userStats);
		activityBreakdown[0].count = allUserStats.reduce(
			(sum, stat) => sum + (stat.totalChatMessages || 0),
			0
		);
		activityBreakdown[1].count = allUserStats.reduce(
			(sum, stat) => sum + (stat.profileUpdateCount || 0),
			0
		);
		activityBreakdown[2].count = allUserStats.reduce(
			(sum, stat) => sum + (stat.passwordChangeCount || 0),
			0
		);

		return json({
			totalUsers: totalUsers[0]?.count || 0,
			todayConversations: todayConversations[0]?.count || 0,
			todayLogins: todayLogins[0]?.count || 0,
			totalActivities: (totalActivities[0]?.count || 0) + (totalAdminActions[0]?.count || 0),
			newUsersThisWeek: newUsersThisWeek[0]?.count || 0,
			activeSessions: activeSessions[0]?.count || 0,
			conversationsTrend,
			activityBreakdown
		});
	} catch (error) {
		console.error('Error fetching analytics data:', error);
		return json({ error: 'Failed to fetch analytics data' }, { status: 500 });
	}
};
