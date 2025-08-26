import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { userSessions, users } from '$lib/db/schema';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		// Check if user is admin
		const session = await locals.getSession();
		if (!session?.user || session.user.role !== 'admin') {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Fetch user sessions with user data
		const sessionsData = await db.query.userSessions.findMany({
			with: {
				user: {
					columns: {
						id: true,
						name: true,
						email: true
					}
				}
			},
			orderBy: (userSessions, { desc }) => [desc(userSessions.loginTime)]
		});

		return json({
			sessions: sessionsData
		});
	} catch (error) {
		console.error('Error fetching sessions:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
