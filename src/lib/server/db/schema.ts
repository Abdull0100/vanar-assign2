import {
	pgTable,
	text,
	timestamp,
	primaryKey,
	integer,
	boolean,
	jsonb,
	index
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';

// Users table - follows common Auth.js adapter schema shape
export const users = pgTable(
	'user',
	{
		id: text('id').notNull().primaryKey(),
		name: text('name'),
		email: text('email').notNull(),
		emailVerified: timestamp('emailVerified', { mode: 'date' }),
		image: text('image'),
		// Additional fields for credentials auth and role-based access
		password: text('password'), // Required for credentials auth
		role: text('role').default('user'), // 'user' | 'admin'
		isEmailVerified: boolean('isEmailVerified').default(false),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => ({
		emailIdx: index('user_email_idx').on(table.email),
		roleIdx: index('user_role_idx').on(table.role)
	})
);

// Accounts table - for OAuth providers (Google, GitHub, etc.)
export const accounts = pgTable(
	'account',
	{
		userId: text('userId')
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
	},
	(table) => ({
		compoundKey: primaryKey({
			columns: [table.provider, table.providerAccountId]
		}),
		userIdIdx: index('account_user_id_idx').on(table.userId)
	})
);

// Sessions table - for user sessions
export const sessions = pgTable(
	'session',
	{
		sessionToken: text('sessionToken').notNull().primaryKey(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		expires: timestamp('expires', { mode: 'date' }).notNull()
	},
	(table) => ({
		userIdIdx: index('session_user_id_idx').on(table.userId)
	})
);

// Verification tokens table - Auth.js compatible with optional custom type
export const verificationTokens = pgTable(
	'verificationToken',
	{
		identifier: text('identifier').notNull(),
		token: text('token').notNull(),
		expires: timestamp('expires', { mode: 'date' }).notNull(),
		// Optional custom column not used by Auth.js adapter
		type: text('type')
	},
	(table) => ({
		compoundKey: primaryKey({ columns: [table.identifier, table.token] }),
		expiresIdx: index('verification_token_expires_idx').on(table.expires)
	})
);

// Chats table - simple chat container owned by a user
export const chats = pgTable(
	'chat',
	{
		id: text('id').notNull().primaryKey(),
		title: text('title').notNull(),
		userId: text('userId')
			.notNull()
			.references(() => users.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow(),
		updatedAt: timestamp('updated_at', { mode: 'date' }).notNull().defaultNow(),
		config: jsonb('config'),
		isPinned: boolean('is_pinned').default(false),
		isArchived: boolean('is_archived').default(false)
	},
	(table) => ({
		userIdIdx: index('chat_user_id_idx').on(table.userId),
		createdAtIdx: index('chat_created_at_idx').on(table.createdAt),
		isPinnedIdx: index('chat_is_pinned_idx').on(table.isPinned)
	})
);

// OTP tokens table - for email verification and password reset using OTP
export const otpTokens = pgTable(
	'otpToken',
	{
		id: text('id').notNull().primaryKey().$defaultFn(() => createId()),
		identifier: text('identifier').notNull(), // email address
		otp: text('otp').notNull(), // 6-digit OTP
		expires: timestamp('expires', { mode: 'date' }).notNull(),
		type: text('type').notNull(), // 'email_verification' | 'password_reset'
		attempts: integer('attempts').default(0).notNull(),
		maxAttempts: integer('maxAttempts').default(3).notNull(),
		createdAt: timestamp('created_at', { mode: 'date' }).notNull().defaultNow()
	},
	(table) => ({
		identifierTypeIdx: index('otp_identifier_type_idx').on(table.identifier, table.type),
		expiresIdx: index('otp_expires_idx').on(table.expires)
	})
);

// Export types for TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;

export type VerificationToken = typeof verificationTokens.$inferSelect;
export type NewVerificationToken = typeof verificationTokens.$inferInsert;

export type Chat = typeof chats.$inferSelect;
export type NewChat = typeof chats.$inferInsert;

export type OtpToken = typeof otpTokens.$inferSelect;
export type NewOtpToken = typeof otpTokens.$inferInsert;
