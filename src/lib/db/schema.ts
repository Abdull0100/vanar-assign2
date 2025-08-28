import { pgTable, text, timestamp, uuid, integer, primaryKey, boolean, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: text('name'),
	email: text('email').notNull().unique(),
	emailVerified: timestamp('emailVerified', { mode: 'date' }),
	image: text('image'),
	password: text('password'),
	role: text('role').default('user').notNull(),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

export const accounts = pgTable('accounts', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	type: text('type').notNull(),
	provider: text('provider').notNull(),
	providerAccountId: text('providerAccountId').notNull(),
	refresh_token: text('refresh_token'),
	access_token: text('access_token'),
	expires_at: integer('expires_at'),
	token_type: text('token_type'),
	scope: text('scope'),
	id_token: text('id_token'),
	session_state: text('session_state')
});

export const sessions = pgTable('sessions', {
	sessionToken: text('sessionToken').primaryKey(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id),
	expires: timestamp('expires', { mode: 'date' }).notNull()
});

export const verificationTokens = pgTable(
	'verificationToken',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(vt) => ({
		compoundKey: primaryKey(vt.identifier, vt.token)
	})
);

export const passwordResetTokens = pgTable('passwordResetTokens', {
	id: uuid('id').primaryKey().defaultRandom(),
	email: text('email').notNull(),
	token: text('token').notNull().unique(),
	expires: timestamp('expires', { mode: 'date' }).notNull(),
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

// Conversations table - represents chat rooms
export const conversations = pgTable('conversations', {
	id: uuid('id').primaryKey().defaultRandom(),
	roomName: text('roomName').notNull(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	summary: text('summary'), // Rolling summary of conversation
	summaryUpdatedAt: timestamp('summaryUpdatedAt'), // When summary was last updated
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

// Chat messages table - each row represents a complete Q&A pair
// When aiResponse is NULL: it's a user message waiting for AI response
// When aiResponse has content: it's a complete Q&A pair with user context + AI response
export const chatMessages = pgTable('chatMessages', {
	id: uuid('id').primaryKey().defaultRandom(), // This is messageId
	conversationId: uuid('conversationId')
		.notNull()
		.references(() => conversations.id, { onDelete: 'cascade' }),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	content: text('content').notNull(), // User query/context
	aiResponse: text('aiResponse'), // AI response text (null for pending user messages, text for complete Q&A pairs)
	previousId: uuid('previousId'), // ID of previous chat in same room for conversation flow
	// New branching and versioning fields
	parentId: uuid('parent_id').references(() => chatMessages.id, { onDelete: 'set null' }), // Parent message for chronological flow
	versionGroupId: uuid('version_group_id'), // Groups all versions of the same logical message
	versionNumber: integer('version_number').default(1).notNull(), // Version number within the group
	// Legacy fields for backward compatibility
	parentMessageId: uuid('parent_message_id').references(() => chatMessages.id, { onDelete: 'set null' }), // Points to the message this was forked from
	branchId: uuid('branch_id'), // Groups related messages in the same branch (set to root message id)
	isForked: boolean('is_forked').default(false).notNull(), // Whether this message is a fork
	originalMessageId: uuid('original_message_id').references(() => chatMessages.id, { onDelete: 'set null' }), // Points to the original message for quick lookup
	messageIndex: integer('message_index'), // Position of this message in the conversation (for <messageIndex, versionIndex> format)
	createdAt: timestamp('createdAt').defaultNow().notNull(), // Timestamp of the Q&A pair
	updatedAt: timestamp('updatedAt').defaultNow().notNull() // When message was last updated
});

// User Sessions table - tracks user login sessions
export const userSessions = pgTable('userSessions', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	sessionToken: text('sessionToken').notNull(),
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	loginTime: timestamp('loginTime', { mode: 'date' }).defaultNow().notNull(),
	logoutTime: timestamp('logoutTime', { mode: 'date' }),
	isActive: boolean('isActive').default(true).notNull(),
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

// User Activities table - tracks all user actions
export const userActivities = pgTable('userActivities', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	activityType: text('activityType').notNull(), // 'chat_message', 'profile_update', 'password_change', 'login', 'logout', etc.
	description: text('description').notNull(),
	metadata: jsonb('metadata'), // Store additional data like chat count, profile changes, etc.
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

// Admin Actions table - tracks all admin actions
export const adminActions = pgTable('adminActions', {
	id: uuid('id').primaryKey().defaultRandom(),
	adminId: uuid('adminId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	targetUserId: uuid('targetUserId')
		.references(() => users.id, { onDelete: 'set null' }), // The user affected by the action (optional for system-wide actions)
	actionType: text('actionType').notNull(), // 'user_delete', 'user_disable', 'user_enable', 'role_change', 'user_ban', etc.
	description: text('description').notNull(),
	metadata: jsonb('metadata'), // Store additional data like previous values, reason, etc.
	ipAddress: text('ipAddress'),
	userAgent: text('userAgent'),
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

// User Stats table - aggregated user statistics
export const userStats = pgTable('userStats', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('userId')
		.notNull()
		.unique()
		.references(() => users.id, { onDelete: 'cascade' }),
	totalChatMessages: integer('totalChatMessages').default(0).notNull(),
	totalConversations: integer('totalConversations').default(0).notNull(),
	lastActivity: timestamp('lastActivity', { mode: 'date' }),
	lastLogin: timestamp('lastLogin', { mode: 'date' }),
	profileUpdateCount: integer('profileUpdateCount').default(0).notNull(),
	passwordChangeCount: integer('passwordChangeCount').default(0).notNull(),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	conversations: many(conversations),
	chatMessages: many(chatMessages),
	userSessions: many(userSessions),
	userActivities: many(userActivities),
	adminActions: many(adminActions, { relationName: 'adminActions' }),
	targetedAdminActions: many(adminActions, { relationName: 'targetedAdminActions' }),
	userStats: many(userStats)
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	})
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	})
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
	messages: many(chatMessages)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [chatMessages.conversationId],
		references: [conversations.id]
	})
}));

export const userSessionsRelations = relations(userSessions, ({ one }) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	})
}));

export const userActivitiesRelations = relations(userActivities, ({ one }) => ({
	user: one(users, {
		fields: [userActivities.userId],
		references: [users.id]
	})
}));

export const adminActionsRelations = relations(adminActions, ({ one }) => ({
	admin: one(users, {
		fields: [adminActions.adminId],
		references: [users.id],
		relationName: 'adminActions'
	}),
	targetUser: one(users, {
		fields: [adminActions.targetUserId],
		references: [users.id],
		relationName: 'targetedAdminActions'
	})
}));

export const userStatsRelations = relations(userStats, ({ one }) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	})
}));
