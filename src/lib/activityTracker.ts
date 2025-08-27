import { db } from '$lib/db';
import { userActivities, adminActions, userSessions, userStats } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { broadcastAdminEvent } from '../routes/api/admin/events/hub';

export interface ActivityMetadata {
	[key: string]: any;
}

export class ActivityTracker {
	/**
	 * Track a user activity
	 */
	static async trackUserActivity(
		userId: string,
		activityType: string,
		description: string,
		metadata?: ActivityMetadata,
		ipAddress?: string,
		userAgent?: string
	) {
		try {
			await db.insert(userActivities).values({
				userId,
				activityType,
				description,
				metadata: metadata || null,
				ipAddress: ipAddress || null,
				userAgent: userAgent || null
			});

			// Update user stats based on activity type
			await this.updateUserStats(userId, activityType);

			// Notify admins
			broadcastAdminEvent({
				type: 'user_activity',
				payload: { userId, activityType, description }
			});
		} catch (error) {
			console.error('Failed to track user activity:', error);
		}
	}

	/**
	 * Track an admin action
	 */
	static async trackAdminAction(
		adminId: string,
		actionType: string,
		description: string,
		targetUserId?: string,
		metadata?: ActivityMetadata,
		ipAddress?: string,
		userAgent?: string
	) {
		try {
			await db.insert(adminActions).values({
				adminId,
				actionType,
				description,
				targetUserId: targetUserId || null,
				metadata: metadata || null,
				ipAddress: ipAddress || null,
				userAgent: userAgent || null
			});

			// Notify admins
			broadcastAdminEvent({
				type: 'admin_action',
				payload: { adminId, actionType, description, targetUserId }
			});
		} catch (error) {
			console.error('Failed to track admin action:', error);
		}
	}

	/**
	 * Track user login session
	 */
	static async trackUserLogin(
		userId: string,
		sessionToken: string,
		ipAddress?: string,
		userAgent?: string
	) {
		try {
			await db.insert(userSessions).values({
				userId,
				sessionToken,
				ipAddress: ipAddress || null,
				userAgent: userAgent || null,
				loginTime: new Date(),
				isActive: true
			});

			// Update last login time in user stats
			await this.updateUserStats(userId, 'login');

			broadcastAdminEvent({ type: 'user_login', payload: { userId } });
		} catch (error) {
			console.error('Failed to track user login:', error);
		}
	}

	/**
	 * Track user logout session
	 */
	static async trackUserLogout(sessionToken: string) {
		try {
			await db
				.update(userSessions)
				.set({
					logoutTime: new Date(),
					isActive: false
				})
				.where(eq(userSessions.sessionToken, sessionToken));

			broadcastAdminEvent({ type: 'user_logout', payload: {} });
		} catch (error) {
			console.error('Failed to track user logout:', error);
		}
	}

	/**
	 * Update user statistics based on activity
	 */
	private static async updateUserStats(userId: string, activityType: string) {
		try {
			// Check if user stats exist
			const existingStats = await db.query.userStats.findFirst({
				where: eq(userStats.userId, userId)
			});

					const now = new Date();
		const updateData: any = {
			lastActivity: now,
			updatedAt: now
		};

			// Update specific counters based on activity type
			switch (activityType) {
				case 'chat_message':
					updateData.totalChatMessages = (existingStats?.totalChatMessages || 0) + 1;
					break;
				case 'conversation_created':
					updateData.totalConversations = (existingStats?.totalConversations || 0) + 1;
					break;
				case 'profile_update':
					updateData.profileUpdateCount = (existingStats?.profileUpdateCount || 0) + 1;
					break;
				case 'password_change':
					updateData.passwordChangeCount = (existingStats?.passwordChangeCount || 0) + 1;
					break;
				case 'login':
					updateData.lastLogin = now;
					break;
			}

			if (existingStats) {
				// Update existing stats
				await db
					.update(userStats)
					.set(updateData)
					.where(eq(userStats.userId, userId));
			} else {
				// Create new stats
				await db.insert(userStats).values({
					userId,
					...updateData,
					totalChatMessages: updateData.totalChatMessages || 0,
					totalConversations: updateData.totalConversations || 0,
					profileUpdateCount: updateData.profileUpdateCount || 0,
					passwordChangeCount: updateData.passwordChangeCount || 0
				});
			}

			broadcastAdminEvent({ type: 'stats_updated', payload: { userId, activityType } });
		} catch (error) {
			console.error('Failed to update user stats:', error);
		}
	}

	/**
	 * Get user statistics
	 */
	static async getUserStats(userId: string) {
		try {
			return await db.query.userStats.findFirst({
				where: eq(userStats.userId, userId)
			});
		} catch (error) {
			console.error('Failed to get user stats:', error);
			return null;
		}
	}

	/**
	 * Get user activities
	 */
	static async getUserActivities(userId: string, limit = 50) {
		try {
			return await db.select().from(userActivities).where(eq(userActivities.userId, userId)).orderBy(userActivities.createdAt).limit(limit);
		} catch (error) {
			console.error('Failed to get user activities:', error);
			return [];
		}
	}

	/**
	 * Get admin actions
	 */
	static async getAdminActions(limit = 50) {
		try {
			return await db.select().from(adminActions).orderBy(adminActions.createdAt).limit(limit);
		} catch (error) {
			console.error('Failed to get admin actions:', error);
			return [];
		}
	}

	/**
	 * Get user sessions
	 */
	static async getUserSessions(userId: string, limit = 50) {
		try {
			return await db.select().from(userSessions).where(eq(userSessions.userId, userId)).orderBy(userSessions.loginTime).limit(limit);
		} catch (error) {
			console.error('Failed to get user sessions:', error);
			return [];
		}
	}

	/**
	 * Get all user statistics for admin panel
	 */
	static async getAllUserStats() {
		try {
			return await db.select().from(userStats).orderBy(userStats.lastActivity);
		} catch (error) {
			console.error('Failed to get all user stats:', error);
			return [];
		}
	}
}

// Convenience functions for common activities
export const trackChatMessage = (userId: string, messageCount: number, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackUserActivity(
		userId,
		'chat_message',
		`User sent a chat message`,
		{ messageCount },
		ipAddress,
		userAgent
	);

export const trackProfileUpdate = (userId: string, changes: Record<string, any>, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackUserActivity(
		userId,
		'profile_update',
		`User updated profile information`,
		{ changes },
		ipAddress,
		userAgent
	);

export const trackPasswordChange = (userId: string, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackUserActivity(
		userId,
		'password_change',
		`User changed password`,
		{},
		ipAddress,
		userAgent
	);

export const trackUserDelete = (adminId: string, targetUserId: string, targetUserEmail: string, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackAdminAction(
		adminId,
		'user_delete',
		`Admin deleted user: ${targetUserEmail}`,
		targetUserId,
		{ targetUserEmail },
		ipAddress,
		userAgent
	);

export const trackRoleChange = (adminId: string, targetUserId: string, oldRole: string, newRole: string, targetUserEmail: string, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackAdminAction(
		adminId,
		'role_change',
		`Admin changed role for ${targetUserEmail} from ${oldRole} to ${newRole}`,
		targetUserId,
		{ oldRole, newRole, targetUserEmail },
		ipAddress,
		userAgent
	);

export const trackUserStatusChange = (adminId: string, targetUserId: string, action: 'enable' | 'disable', targetUserEmail: string, ipAddress?: string, userAgent?: string) =>
	ActivityTracker.trackAdminAction(
		adminId,
		`user_${action}`,
		`Admin ${action}d user: ${targetUserEmail}`,
		targetUserId,
		{ action, targetUserEmail },
		ipAddress,
		userAgent
	);
