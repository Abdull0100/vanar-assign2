import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { userActivities, users } from '$lib/db/schema';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		const session = await locals.getSession();
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch user activities with user data
		const activitiesData = await db.query.userActivities.findMany({
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			orderBy: (userActivities, { desc }) => [desc(userActivities.createdAt)]
		});

		return json({
			activities: activitiesData
		});
	} catch (error) {
		console.error('Error fetching user activities:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
