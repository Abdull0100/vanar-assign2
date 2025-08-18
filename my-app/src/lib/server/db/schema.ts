import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core';

/* ========================
   USERS TABLE
   ======================== */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // Optional for OAuth users
  name: text('name'),
  verified: boolean('verified').default(false).notNull(), // email verification status
  role: text('role').default('user').notNull(), // 'user' or 'admin'
  provider: text('provider'), // 'google', 'email', etc.
  providerId: text('provider_id'), // Google user ID
  avatar: text('avatar'), // Profile picture URL
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

/* ========================
   SESSIONS TABLE
   ======================== */
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/* ========================
   PASSWORD RESETS TABLE
   ======================== */
export const passwordResets = pgTable('password_resets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  otp: text('otp').notNull(), // 6-digit OTP code
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

/* ========================
   EMAIL VERIFICATIONS TABLE
   ======================== */
export const emailVerifications = pgTable('email_verifications', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull()
});
