import { relations } from "drizzle-orm/relations";
import { users, userSessions, accounts, adminActions, sessions, userActivities, conversations, chatMessages, userStats } from "./schema";

export const userSessionsRelations = relations(userSessions, ({one}) => ({
	user: one(users, {
		fields: [userSessions.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	userSessions: many(userSessions),
	accounts: many(accounts),
	adminActions_adminId: many(adminActions, {
		relationName: "adminActions_adminId_users_id"
	}),
	adminActions_targetUserId: many(adminActions, {
		relationName: "adminActions_targetUserId_users_id"
	}),
	sessions: many(sessions),
	userActivities: many(userActivities),
	chatMessages: many(chatMessages),
	conversations: many(conversations),
	userStats: many(userStats),
}));

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const adminActionsRelations = relations(adminActions, ({one}) => ({
	user_adminId: one(users, {
		fields: [adminActions.adminId],
		references: [users.id],
		relationName: "adminActions_adminId_users_id"
	}),
	user_targetUserId: one(users, {
		fields: [adminActions.targetUserId],
		references: [users.id],
		relationName: "adminActions_targetUserId_users_id"
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const userActivitiesRelations = relations(userActivities, ({one}) => ({
	user: one(users, {
		fields: [userActivities.userId],
		references: [users.id]
	}),
}));

export const chatMessagesRelations = relations(chatMessages, ({one, many}) => ({
	conversation: one(conversations, {
		fields: [chatMessages.conversationId],
		references: [conversations.id]
	}),
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
	chatMessage_parentMessageId: one(chatMessages, {
		fields: [chatMessages.parentMessageId],
		references: [chatMessages.id],
		relationName: "chatMessages_parentMessageId_chatMessages_id"
	}),
	chatMessages_parentMessageId: many(chatMessages, {
		relationName: "chatMessages_parentMessageId_chatMessages_id"
	}),
	chatMessage_originalMessageId: one(chatMessages, {
		fields: [chatMessages.originalMessageId],
		references: [chatMessages.id],
		relationName: "chatMessages_originalMessageId_chatMessages_id"
	}),
	chatMessages_originalMessageId: many(chatMessages, {
		relationName: "chatMessages_originalMessageId_chatMessages_id"
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	chatMessages: many(chatMessages),
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
}));

export const userStatsRelations = relations(userStats, ({one}) => ({
	user: one(users, {
		fields: [userStats.userId],
		references: [users.id]
	}),
}));