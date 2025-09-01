import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { trackUserStatusChange } from '$lib/activityTracker';

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

		const { active } = await request.json();
		const { userId } = params;

		if (typeof active !== 'boolean') {
			return json({ error: 'Invalid active status' }, { status: 400 });
		}

		// Prevent users from changing their own status
		if (session.user.id === userId) {
			return json({ error: 'You cannot change your own status' }, { status: 400 });
		}

		// Fetch the user before update to get their details
		const [userBefore] = await db
			.select()
			.from(users)
			.where(eq(users.id, userId as string));

		if (!userBefore) {
			return json({ error: 'User not found' }, { status: 404 });
		}

		// Check if status is already set to the desired value
		const currentStatus = !!userBefore.emailVerified;
		if (currentStatus === active) {
			return json({ message: 'User status is already set to this value' });
		}

		// For now, we'll use emailVerified as a proxy for active status
		// In a real app, you might want to add an 'active' field to the users table
		const updateData = active ? { emailVerified: new Date() } : { emailVerified: null };

		await db
			.update(users)
			.set(updateData)
			.where(eq(users.id, userId as string));

		// Track the admin action
		await trackUserStatusChange(
			session.user.id,
			userId as string,
			active ? 'enable' : 'disable',
			userBefore.email,
			locals.request?.headers.get('x-forwarded-for') ||
				locals.request?.headers.get('x-real-ip') ||
				undefined,
			locals.request?.headers.get('user-agent') || undefined
		);

		return json({ message: 'User status updated successfully' });
	} catch (error) {
		console.error('Update user status error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
