import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, userStats } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Get all users
		const allUsers = await db.select().from(users).orderBy(users.createdAt);

		// Get user stats for each user
		const usersWithStats = await Promise.all(
			allUsers.map(async (user) => {
				const stats = await db
					.select()
					.from(userStats)
					.where(eq(userStats.userId, user.id))
					.limit(1);
				return {
					id: user.id,
					name: user.name,
					email: user.email,
					role: user.role,
					createdAt: user.createdAt,
					emailVerified: user.emailVerified,
					stats: stats[0] || null
				};
			})
		);

		return json({ users: usersWithStats });
	} catch (error) {
		console.error('Get users error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
