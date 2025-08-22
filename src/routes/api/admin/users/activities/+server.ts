import { json, type RequestHandler } from '@sveltejs/kit';
import { ActivityTracker } from '$lib/activityTracker';
import { db } from '$lib/db';
import { userActivities, users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals, url }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const limit = parseInt(url.searchParams.get('limit') || '100');

		// Get all user activities
		const activities = await db.select().from(userActivities).orderBy(userActivities.createdAt).limit(limit);

		// Get user information for each activity
		const activitiesWithUsers = await Promise.all(
			activities.map(async (activity) => {
				const user = await db.select().from(users).where(eq(users.id, activity.userId)).limit(1);
				return {
					...activity,
					user: user[0] ? {
						id: user[0].id,
						name: user[0].name,
						email: user[0].email
					} : null
				};
			})
		);

		return json({
			activities: activitiesWithUsers
		});
	} catch (error) {
		console.error('Get all user activities error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
