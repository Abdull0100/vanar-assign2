import { pgTable, unique, uuid, text, timestamp, foreignKey, boolean, integer, jsonb, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const passwordResetTokens = pgTable("passwordResetTokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("passwordResetTokens_token_unique").on(table.token),
]);

export const userSessions = pgTable("userSessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	sessionToken: text().notNull(),
	ipAddress: text(),
	userAgent: text(),
	loginTime: timestamp({ mode: 'string' }).defaultNow().notNull(),
	logoutTime: timestamp({ mode: 'string' }),
	isActive: boolean().default(true).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "userSessions_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	name: text(),
	email: text().notNull(),
	emailVerified: timestamp({ mode: 'string' }),
	image: text(),
	password: text(),
	role: text().default('user').notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("users_email_unique").on(table.email),
]);

export const accounts = pgTable("accounts", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	type: text().notNull(),
	provider: text().notNull(),
	providerAccountId: text().notNull(),
	refreshToken: text("refresh_token"),
	accessToken: text("access_token"),
	expiresAt: integer("expires_at"),
	tokenType: text("token_type"),
	scope: text(),
	idToken: text("id_token"),
	sessionState: text("session_state"),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "accounts_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const adminActions = pgTable("adminActions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminId: uuid().notNull(),
	targetUserId: uuid(),
	actionType: text().notNull(),
	description: text().notNull(),
	metadata: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.adminId],
			foreignColumns: [users.id],
			name: "adminActions_adminId_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.targetUserId],
			foreignColumns: [users.id],
			name: "adminActions_targetUserId_users_id_fk"
		}).onDelete("set null"),
]);

export const sessions = pgTable("sessions", {
	sessionToken: text().primaryKey().notNull(),
	userId: uuid().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_userId_users_id_fk"
		}),
]);

export const userActivities = pgTable("userActivities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	activityType: text().notNull(),
	description: text().notNull(),
	metadata: jsonb(),
	ipAddress: text(),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "userActivities_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const chatMessages = pgTable("chatMessages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	conversationId: uuid().notNull(),
	userId: uuid().notNull(),
	content: text().notNull(),
	aiResponse: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	previousId: uuid(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	parentMessageId: uuid("parent_message_id"),
	branchId: uuid("branch_id"),
	versionNumber: integer("version_number").default(1).notNull(),
	isForked: boolean("is_forked").default(false).notNull(),
	originalMessageId: uuid("original_message_id"),
	messageIndex: integer("message_index"),
}, (table) => [
	foreignKey({
			columns: [table.conversationId],
			foreignColumns: [conversations.id],
			name: "chatMessages_conversationId_conversations_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "chatMessages_userId_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.parentMessageId],
			foreignColumns: [table.id],
			name: "chatMessages_parent_message_id_chatMessages_id_fk"
		}).onDelete("set null"),
	foreignKey({
			columns: [table.originalMessageId],
			foreignColumns: [table.id],
			name: "chatMessages_original_message_id_chatMessages_id_fk"
		}).onDelete("set null"),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	roomName: text().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	summary: text(),
	summaryUpdatedAt: timestamp({ mode: 'string' }),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_userId_users_id_fk"
		}).onDelete("cascade"),
]);

export const userStats = pgTable("userStats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	totalChatMessages: integer().default(0).notNull(),
	totalConversations: integer().default(0).notNull(),
	lastActivity: timestamp({ mode: 'string' }),
	lastLogin: timestamp({ mode: 'string' }),
	profileUpdateCount: integer().default(0).notNull(),
	passwordChangeCount: integer().default(0).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "userStats_userId_users_id_fk"
		}).onDelete("cascade"),
	unique("userStats_userId_unique").on(table.userId),
]);

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
]);
