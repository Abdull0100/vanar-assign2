import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { chatMessages, conversations } from '../src/lib/db/schema.js';
import { eq, and, asc } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://username:password@localhost:5432/your_database';
const client = postgres(connectionString);
const db = drizzle(client);

async function migrateExistingMessages() {
	console.log('Starting migration of existing messages to support forking...');
	
	try {
		// Get all conversations
		const allConversations = await db.query.conversations.findMany({
			columns: { id: true, roomName: true }
		});
		
		console.log(`Found ${allConversations.length} conversations to migrate`);
		
		for (const conversation of allConversations) {
			console.log(`\nMigrating conversation: ${conversation.roomName} (${conversation.id})`);
			
			// Get all messages for this conversation in chronological order
			const messages = await db.query.chatMessages.findMany({
				where: eq(chatMessages.roomId, conversation.id),
				orderBy: (chatMessages, { asc }) => [asc(chatMessages.createdAt)],
				columns: {
					id: true,
					role: true,
					content: true,
					parentId: true,
					createdAt: true
				}
			});
			
			console.log(`Found ${messages.length} messages`);
			
			if (messages.length === 0) continue;
			
			let lastMessageId = null;
			
			// Update messages to have proper parentId relationships
			for (const message of messages) {
				if (message.parentId === null && lastMessageId !== null) {
					// This message doesn't have a parentId but should
					console.log(`  Updating message ${message.id} (${message.role}) to have parentId: ${lastMessageId}`);
					
					await db.update(chatMessages)
						.set({ 
							parentId: lastMessageId,
							updatedAt: new Date()
						})
						.where(eq(chatMessages.id, message.id));
				}
				
				// Update lastMessageId for the next iteration
				lastMessageId = message.id;
			}
			
			console.log(`  Migration completed for conversation: ${conversation.roomName}`);
		}
		
		console.log('\n✅ Migration completed successfully!');
		
	} catch (error) {
		console.error('❌ Migration failed:', error);
	} finally {
		await client.end();
	}
}

// Run the migration
migrateExistingMessages();
