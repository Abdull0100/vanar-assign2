import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/db';
import { userStats, userActivities } from '$lib/db/schema';
import { eq, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const { userId } = params;

		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Fetch user stats for the specific user
		const stats = await db.select().from(userStats).where(eq(userStats.userId, userId)).limit(1);

		// Fetch the most recent activity for this user
		const lastActivity = await db.select().from(userActivities)
			.where(eq(userActivities.userId, userId))
			.orderBy(desc(userActivities.createdAt))
			.limit(1);

		if (stats.length === 0) {
			return json({ 
				stats: {
					totalChatMessages: 0,
					totalConversations: 0,
					lastActivity: null,
					lastLogin: null,
					profileUpdateCount: 0,
					passwordChangeCount: 0,
					lastActivityDetails: lastActivity.length > 0 ? {
						description: lastActivity[0].description,
						activityType: lastActivity[0].activityType,
						createdAt: lastActivity[0].createdAt
					} : null
				}
			});
		}

		const userStatsData = stats[0];
		
		// Add last activity details to the stats
		const statsWithActivity = {
			...userStatsData,
			lastActivityDetails: lastActivity.length > 0 ? {
				description: lastActivity[0].description,
				activityType: lastActivity[0].activityType,
				createdAt: lastActivity[0].createdAt
			} : null
		};

		return json({ stats: statsWithActivity });
	} catch (error) {
		console.error('Error fetching user stats:', error);
		return json({ error: 'Failed to fetch user stats' }, { status: 500 });
	}
};
