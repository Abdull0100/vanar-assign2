import { redirect, fail } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users } from '$lib/server/db/schema';
import { eq, count, and, not } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// Check if user is authenticated
	if (!locals.user) {
		console.log('❌ Admin access denied: No user session');
		throw redirect(302, '/login');
	}

	// Check if user has admin role
	if (locals.user.role !== 'admin') {
		console.log(`❌ Admin access denied: User ${locals.user.email} has role "${locals.user.role}"`);
		throw redirect(302, '/?error=admin_access_denied');
	}

	console.log(`✅ Admin access granted: ${locals.user.email} (${locals.user.role})`);

	const db = getDb();

	// Fetch all users
	const allUsers = await db.select({
		id: users.id,
		name: users.name,
		email: users.email,
		role: users.role,
		verified: users.verified,
		disabled: users.disabled,
		provider: users.provider,
		createdAt: users.createdAt
	}).from(users).orderBy(users.createdAt);

	// Calculate statistics
	const totalUsers = allUsers.length;
	const activeUsers = allUsers.filter(user => !user.disabled).length;
	const adminUsers = allUsers.filter(user => user.role === 'admin').length;
	const regularUsers = totalUsers - adminUsers;

	return {
		user: locals.user,
		users: allUsers,
		stats: {
			totalUsers,
			activeUsers,
			adminUsers,
			regularUsers
		}
	};
};

export const actions: Actions = {
	updateUserRole: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const newRole = formData.get('role') as string;

		if (!userId || !newRole || !['user', 'admin'].includes(newRole)) {
			return fail(400, { error: 'Invalid data' });
		}

		try {
			const db = getDb();
			await db.update(users)
				.set({ 
					role: newRole,
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));

			return { success: true, message: 'User role updated successfully' };
		} catch (error) {
			console.error('Error updating user role:', error);
			return fail(500, { error: 'Failed to update user role' });
		}
	},

	toggleUserStatus: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const formData = await request.formData();
		const userId = formData.get('userId') as string;
		const currentStatus = formData.get('currentStatus') as string;

		if (!userId || !currentStatus) {
			return fail(400, { error: 'Invalid data' });
		}

		const newStatus = currentStatus === 'true' ? false : true;

		try {
			const db = getDb();
			await db.update(users)
				.set({ 
					disabled: newStatus,
					updatedAt: new Date()
				})
				.where(eq(users.id, userId));

			return { success: true, message: `User ${newStatus ? 'disabled' : 'enabled'} successfully` };
		} catch (error) {
			console.error('Error toggling user status:', error);
			return fail(500, { error: 'Failed to update user status' });
		}
	}
};
