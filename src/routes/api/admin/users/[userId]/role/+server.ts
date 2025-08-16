import { json , type RequestHandler} from '@sveltejs/kit';
import { sendAdminPromotionEmail } from '$lib/email';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ request, params, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// Check if user is admin
		if (session.user.role !== 'admin') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const { role } = await request.json();
		const { userId } = params;

		if (!role || !['user', 'admin'].includes(role)) {
			return json({ error: 'Invalid role' }, { status: 400 });
		}
		if (!userId) {
			return json({ error: 'User ID is required' }, { status: 400 });
		}

		// Fetch the user before update
		const [userBefore] = await db.select().from(users).where(eq(users.id, userId as string));

		await db.update(users).set({ role }).where(eq(users.id, userId as string));

		// Fetch the user after update
		const [userAfter] = await db.select().from(users).where(eq(users.id, userId as string));

		// If the role was changed to admin, send the promotion email
		if (userBefore && userAfter && userBefore.role !== 'admin' && userAfter.role === 'admin' && userAfter.email) {
			await sendAdminPromotionEmail(userAfter.email, userAfter.name || "User");
		  }

		return json({ message: 'User role updated successfully' });
	} catch (error) {
		console.error('Update user role error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
