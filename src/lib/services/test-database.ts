// Test database insertion with the corrected schema
import { db } from '$lib/db';
import { documents, documentChunks } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

async function testDatabaseInsertion() {
	console.log('Testing database insertion with corrected schema...');

	try {
		// Test 1: Check if we can query existing documents
		console.log('1. Testing document queries...');
		const existingDocs = await db.query.documents.findMany();
		console.log('Found documents:', existingDocs.length);

		// Test 2: Try to insert a test chunk
		console.log('2. Testing chunk insertion...');

		const testEmbedding = new Array(768).fill(0).map((_, i) => Math.random() - 0.5);

		const testChunk = {
			documentId: existingDocs[0]?.id || 'test-doc-id',
			userId: 'test-user-id',
			content: 'This is a test chunk for database insertion.',
			chunkIndex: 0,
			totalChunks: 1,
			embedding: testEmbedding,
			metadata: { test: true }
		};

		const result = await db.insert(documentChunks).values(testChunk).returning();
		console.log('✅ Chunk inserted successfully:', result[0]?.id);

		// Test 3: Query the inserted chunk
		console.log('3. Testing chunk retrieval...');
		const retrievedChunk = await db.query.documentChunks.findFirst({
			where: eq(documentChunks.id, result[0].id)
		});

		console.log('✅ Chunk retrieved successfully:', {
			id: retrievedChunk?.id,
			contentLength: retrievedChunk?.content?.length,
			embeddingLength: retrievedChunk?.embedding?.length
		});

		// Clean up test data
		await db.delete(documentChunks).where(eq(documentChunks.id, result[0].id));
		console.log('✅ Test cleanup completed');

	} catch (error) {
		console.error('❌ Database test failed:', error);
		console.error('Error details:', error);
	}
}

testDatabaseInsertion();
