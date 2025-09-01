import { json, type RequestHandler } from '@sveltejs/kit';
import { ActivityTracker } from '$lib/activityTracker';

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

		const limit = parseInt(url.searchParams.get('limit') || '50');
		const actionType = url.searchParams.get('actionType');
		const adminId = url.searchParams.get('adminId');
		const targetUserId = url.searchParams.get('targetUserId');

		// Get admin actions with filters
		let actions = await ActivityTracker.getAdminActions(limit);

		// Apply filters if provided
		if (actionType) {
			actions = actions.filter((action) => action.actionType === actionType);
		}
		if (adminId) {
			actions = actions.filter((action) => action.adminId === adminId);
		}
		if (targetUserId) {
			actions = actions.filter((action) => action.targetUserId === targetUserId);
		}

		// Group actions by type for summary
		const actionSummary = actions.reduce(
			(acc, action) => {
				acc[action.actionType] = (acc[action.actionType] || 0) + 1;
				return acc;
			},
			{} as Record<string, number>
		);

		// Get recent actions by different admins
		const recentByAdmin = actions
			.filter((action) => action.adminId)
			.reduce(
				(acc, action) => {
					const adminName = action.adminId || 'Unknown';
					if (!acc[adminName]) {
						acc[adminName] = [];
					}
					acc[adminName].push(action);
					return acc;
				},
				{} as Record<string, any[]>
			);

		return json({
			actions,
			summary: {
				total: actions.length,
				byType: actionSummary,
				recentByAdmin
			}
		});
	} catch (error) {
		console.error('Get admin actions error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
