import { pgTable, foreignKey, uuid, text, integer, unique, timestamp, primaryKey, boolean, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



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

export const passwordResetTokens = pgTable("passwordResetTokens", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	email: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("passwordResetTokens_token_unique").on(table.token),
]);

export const chatMessages = pgTable("chatMessages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	roomId: uuid().notNull(),
	role: text().notNull(),
	content: text().notNull(),
	parentId: uuid(),
	previousId: uuid(),
	versionNumber: integer().default(1).notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.roomId],
			foreignColumns: [conversations.id],
			name: "chatMessages_roomId_conversations_id_fk"
		}).onDelete("cascade"),
]);

export const conversations = pgTable("conversations", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
	roomName: text().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "conversations_userId_users_id_fk"
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

export const verificationToken = pgTable("verificationToken", {
	identifier: text().notNull(),
	token: text().notNull(),
	expires: timestamp({ mode: 'string' }).notNull(),
}, (table) => [
	primaryKey({ columns: [table.identifier, table.token], name: "verificationToken_identifier_token_pk"}),
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

export const userActivities = pgTable("userActivities", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull(),
	activityType: text().notNull(), // 'chat_message', 'profile_update', 'password_change', 'login', 'logout', etc.
	description: text().notNull(),
	metadata: jsonb(), // Store additional data like chat count, profile changes, etc.
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

export const adminActions = pgTable("adminActions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	adminId: uuid().notNull(), // The admin who performed the action
	targetUserId: uuid(), // The user affected by the action (optional for system-wide actions)
	actionType: text().notNull(), // 'user_delete', 'user_disable', 'user_enable', 'role_change', 'user_ban', etc.
	description: text().notNull(),
	metadata: jsonb(), // Store additional data like previous values, reason, etc.
	ipAddress: text(),
	userAgent: text(),
	createdAt: timestamp({ mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
		columns: [adminId],
		foreignColumns: [users.id],
		name: "adminActions_adminId_users_id_fk"
	}).onDelete("cascade"),
	foreignKey({
		columns: [targetUserId],
		foreignColumns: [users.id],
		name: "adminActions_targetUserId_users_id_fk"
	}).onDelete("set null"),
]);

export const userStats = pgTable("userStats", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid().notNull().unique(),
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
]);
