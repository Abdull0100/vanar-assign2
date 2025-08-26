import { relations } from "drizzle-orm/relations";
import { users, accounts, conversations, chatMessages, sessions } from "./schema";

export const accountsRelations = relations(accounts, ({one}) => ({
	user: one(users, {
		fields: [accounts.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	accounts: many(accounts),
	conversations: many(conversations),
	sessions: many(sessions),
}));

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	conversation: one(conversations, {
		fields: [chatMessages.roomId],
		references: [conversations.id]
	}),
}));

export const conversationsRelations = relations(conversations, ({one, many}) => ({
	chatMessages: many(chatMessages),
	user: one(users, {
		fields: [conversations.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));