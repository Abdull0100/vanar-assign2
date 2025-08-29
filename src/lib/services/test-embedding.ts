// Simple test script to check if embeddings are working
import { DocumentProcessor } from './DocumentProcessor';

async function testEmbeddings() {
	console.log('Testing embedding generation...');

	const processor = new DocumentProcessor();

	try {
		// Test text extraction
		console.log('1. Testing text extraction...');
		const testText = 'This is a test document for embedding generation.';
		console.log('Test text:', testText);

		// Test chunking
		console.log('2. Testing text chunking...');
		const chunks = processor.createChunks(testText, 50, 10);
		console.log('Chunks created:', chunks.length);
		console.log('Chunks:', chunks);

		// Test embedding generation
		console.log('3. Testing embedding generation...');
		const embeddings = await processor.generateEmbeddingsForChunks(chunks);
		console.log('Embeddings generated:', embeddings.length);
		console.log('First embedding dimensions:', embeddings[0]?.length || 'N/A');

		if (embeddings.length > 0 && embeddings[0].length === 768) {
			console.log('✅ Embeddings are working correctly!');
		} else {
			console.log('❌ Embedding dimensions incorrect. Expected 768, got:', embeddings[0]?.length);
		}

	} catch (error) {
		console.error('❌ Embedding test failed:', error);
	}
}

testEmbeddings();
