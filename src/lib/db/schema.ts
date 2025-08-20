import { pgTable, text, timestamp, uuid, integer, primaryKey } from 'drizzle-orm/pg-core';
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
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	roomName: text('roomName').notNull(), // Changed from 'title' to 'roomName'
	// Rolling summary of older parts of the conversation to keep context compact
	summary: text('summary'),
	summaryUpdatedAt: timestamp('summaryUpdatedAt', { mode: 'date' }),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

// Chat messages table - each message is separate and linked to a conversation
export const chatMessages = pgTable('chatMessages', {
	id: uuid('id').primaryKey().defaultRandom(), // This is messageId
	conversationId: uuid('conversationId')
		.notNull()
		.references(() => conversations.id, { onDelete: 'cascade' }),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	content: text('content').notNull(), // User query or empty string for AI
	sender: text('sender').notNull(), // 'user' or 'ai'
	aiResponse: text('aiResponse'), // AI response text (null for user messages, text for AI)
	createdAt: timestamp('createdAt').defaultNow().notNull() // This is timestamp
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
	accounts: many(accounts),
	sessions: many(sessions),
	conversations: many(conversations),
	chatMessages: many(chatMessages)
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
