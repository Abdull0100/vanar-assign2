import { pgTable, text, timestamp, uuid, integer, primaryKey, boolean, jsonb, customType } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Custom vector type for pgvector
const vector = customType<{
    data: number[];
    driverData: string;
}>({
    dataType(config: unknown) {
        const configObj = config as { dimensions?: number } | undefined;
        if (!configObj) return 'vector(768)'; // Default for Gemini embeddings
        return `vector(${configObj.dimensions || 768})`;
    },
    toDriver(value: number[]): string {
        // Convert to PostgreSQL vector format: [1.0,2.0,3.0]
        return `[${value.join(',')}]`;
    },
    fromDriver(value: string | number[]): number[] {
        try {
            // Handle case where value is already an array (from database)
            if (Array.isArray(value)) {
                return value;
            }

            // Parse vector string format [1.0,2.0,3.0]
            const vectorStr = value as string;
            if (vectorStr.startsWith('[') && vectorStr.endsWith(']')) {
                const values = vectorStr.slice(1, -1).split(',');
                return values.map(v => parseFloat(v.trim()));
            }

            // Fallback: try parsing as JSON
            const parsed = JSON.parse(vectorStr);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            console.error('Error parsing vector:', error, 'Value:', value);
            return [];
        }
    },
});

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
	id: uuid('id').primaryKey().defaultRandom(), // Unique message ID
	conversationId: uuid('conversationId')
	  .notNull()
	  .references(() => conversations.id, { onDelete: 'cascade' }),
	userId: uuid('userId')
	  .notNull()
	  .references(() => users.id, { onDelete: 'cascade' }),
	role: text('role').notNull().default('user'), // 'user' | 'assistant' | 'system'
	content: text('content').notNull(), // Message content
	parentId: uuid('parentId'), // Parent message ID (null for root)
	childrenIds: jsonb('childrenIds').$type<string[]>().default([]), // Forks stored here
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull(),
	// Legacy flat conversation pointer
	previousId: uuid('previousId') // (deprecated, linear flow only)
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
	userStats: many(userStats),
	documents: many(documents),
	documentChunks: many(documentChunks)
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
	messages: many(chatMessages),
	documents: many(documents),
	documentChunks: many(documentChunks)
}));

export const chatMessagesRelations = relations(chatMessages, ({ one, many }) => ({
	user: one(users, {
		fields: [chatMessages.userId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [chatMessages.conversationId],
		references: [conversations.id]
	}),
	parent: one(chatMessages, {
		fields: [chatMessages.parentId],
		references: [chatMessages.id],
		relationName: 'messageParent'
	}),
	children: many(chatMessages, {
		relationName: 'messageParent'
	}),
	citations: many(citations)
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

// Document Management Tables
export const documents = pgTable('documents', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	conversationId: uuid('conversationId')
		.references(() => conversations.id, { onDelete: 'cascade' }), // Optional: scope to specific conversation
	fileName: text('fileName').notNull(),
	originalName: text('originalName').notNull(),
	fileSize: integer('fileSize').notNull(),
	mimeType: text('mimeType').notNull(),
	fileType: text('fileType').notNull(), // 'pdf', 'docx', 'txt'
	status: text('status').notNull().default('processing'), // 'processing', 'completed', 'failed'
	extractedText: text('extractedText'),
	fileContent: text('fileContent'), // Base64 encoded file content for download
	errorMessage: text('errorMessage'),
	createdAt: timestamp('createdAt').defaultNow().notNull(),
	updatedAt: timestamp('updatedAt').defaultNow().notNull()
});

export const documentChunks = pgTable('documentChunks', {
	id: uuid('id').primaryKey().defaultRandom(),
	documentId: uuid('documentId')
		.notNull()
		.references(() => documents.id, { onDelete: 'cascade' }),
	userId: uuid('userId')
		.notNull()
		.references(() => users.id, { onDelete: 'cascade' }),
	conversationId: uuid('conversationId')
		.references(() => conversations.id, { onDelete: 'cascade' }), // Optional: scope to specific conversation
	content: text('content').notNull(),
	chunkIndex: integer('chunkIndex').notNull(),
	totalChunks: integer('totalChunks').notNull(),
	embedding: vector('embedding', { dimensions: 768 }), // Vector embedding for semantic search
	metadata: jsonb('metadata'), // Additional metadata like page numbers, headings, etc.
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
export type DocumentChunk = typeof documentChunks.$inferSelect;
export type NewDocumentChunk = typeof documentChunks.$inferInsert;
export type Citation = typeof citations.$inferSelect;
export type NewCitation = typeof citations.$inferInsert;

export const citations = pgTable('citations', {
	id: uuid('id').primaryKey().defaultRandom(),
	chatMessageId: uuid('chatMessageId')
		.notNull()
		.references(() => chatMessages.id, { onDelete: 'cascade' }),
	documentId: uuid('documentId')
		.notNull()
		.references(() => documents.id, { onDelete: 'cascade' }),
	chunkIds: jsonb('chunkIds').$type<string[]>().notNull(), // Array of chunk IDs used
	relevanceScore: integer('relevanceScore'), // Optional: similarity score
	citationText: text('citationText').notNull(), // Excerpt from the document
	pageNumber: integer('pageNumber'), // For PDFs
	section: text('section'), // Document section/heading
	createdAt: timestamp('createdAt').defaultNow().notNull()
});

// Relations for new tables
export const documentsRelations = relations(documents, ({ one, many }) => ({
	user: one(users, {
		fields: [documents.userId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [documents.conversationId],
		references: [conversations.id]
	}),
	chunks: many(documentChunks),
	citations: many(citations)
}));

export const documentChunksRelations = relations(documentChunks, ({ one }) => ({
	document: one(documents, {
		fields: [documentChunks.documentId],
		references: [documents.id]
	}),
	user: one(users, {
		fields: [documentChunks.userId],
		references: [users.id]
	}),
	conversation: one(conversations, {
		fields: [documentChunks.conversationId],
		references: [conversations.id]
	})
}));

export const citationsRelations = relations(citations, ({ one }) => ({
	chatMessage: one(chatMessages, {
		fields: [citations.chatMessageId],
		references: [chatMessages.id]
	}),
	document: one(documents, {
		fields: [citations.documentId],
		references: [documents.id]
	})
}));




