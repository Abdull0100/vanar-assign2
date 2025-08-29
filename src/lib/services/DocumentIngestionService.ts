import { db } from '$lib/db';
import { documents, documentChunks } from '$lib/db/schema';
import { DocumentProcessor } from './DocumentProcessor';
import { eq } from 'drizzle-orm';
import type { NewDocument, NewDocumentChunk } from '$lib/db/schema';

export interface IngestionProgress {
	status: 'processing' | 'completed' | 'failed';
	progress: number; // 0-100
	currentStep: string;
	errorMessage?: string;
}

export interface IngestionResult {
	documentId: string;
	totalChunks: number;
	totalTokens: number;
	processingTime: number;
}

export class DocumentIngestionService {
	private documentProcessor: DocumentProcessor;

	constructor() {
		this.documentProcessor = new DocumentProcessor();
	}

	/**
	 * Complete ingestion pipeline: upload → extract → chunk → embed → store
	 */
	async ingestDocument(
		file: File,
		userId: string,
		onProgress?: (progress: IngestionProgress) => void,
		conversationId?: string,
		documentId?: string
	): Promise<IngestionResult> {
		const startTime = Date.now();
		let progress: IngestionProgress = {
			status: 'processing',
			progress: 0,
			currentStep: 'Initializing...'
		};

		try {
			console.log(`🔄 Starting document ingestion for user ${userId}, file: ${file.name}`);

			// Step 1: Use existing document record or create new one
			onProgress?.({ ...progress, currentStep: 'Preparing document record...' });
			const finalDocumentId = documentId || await this.createDocumentRecord(file, userId, conversationId);
			console.log(`✅ Using document record: ${finalDocumentId}`);

			// Step 2: Extract text from file
			onProgress?.({
				...progress,
				progress: 20,
				currentStep: 'Extracting text from file...'
			});
			console.log(`📄 Extracting text from ${file.name} (${file.type})`);
			const extractedText = await this.documentProcessor.extractText(file, this.getFileType(file));
			console.log(`✅ Text extracted: ${extractedText.length} characters`);

			// Step 3: Clean and validate text
			onProgress?.({
				...progress,
				progress: 35,
				currentStep: 'Cleaning and validating text...'
			});
			const cleanedText = this.documentProcessor.cleanText(extractedText);
			const metadata = this.documentProcessor.getMetadata(cleanedText);

			// Step 4: Create chunks with overlap
			onProgress?.({
				...progress,
				progress: 45,
				currentStep: 'Creating text chunks...'
			});
			const chunks = this.documentProcessor.createChunks(cleanedText, 1000, 200);

			if (chunks.length === 0) {
				throw new Error('No text chunks could be created from the document');
			}

			// Step 5: Generate embeddings for chunks
			onProgress?.({
				...progress,
				progress: 60,
				currentStep: 'Generating embeddings...'
			});
			console.log(`🧠 Generating embeddings for ${chunks.length} chunks`);
			const embeddings = await this.documentProcessor.generateEmbeddingsForChunks(chunks);
			console.log(`✅ Embeddings generated: ${embeddings.length} embeddings, first embedding has ${embeddings[0]?.length || 0} dimensions`);

			// Step 6: Store chunks and embeddings in database
			onProgress?.({
				...progress,
				progress: 80,
				currentStep: 'Storing chunks and embeddings...'
			});
			console.log(`💾 Storing ${chunks.length} chunks and embeddings in database`);
			const totalTokens = await this.storeChunksAndEmbeddings(
				finalDocumentId,
				chunks,
				embeddings,
				userId,
				metadata,
				conversationId
			);
			console.log(`✅ Chunks stored successfully: ${chunks.length} chunks, ${totalTokens} estimated tokens`);

			// Step 7: Update document status to completed
			onProgress?.({
				...progress,
				progress: 95,
				currentStep: 'Finalizing...'
			});
			await this.updateDocumentStatus(finalDocumentId, 'completed');

			const processingTime = Date.now() - startTime;

			onProgress?.({
				status: 'completed',
				progress: 100,
				currentStep: 'Ingestion completed successfully!'
			});

			return {
				documentId: finalDocumentId,
				totalChunks: chunks.length,
				totalTokens,
				processingTime
			};

		} catch (error: any) {
			console.error('Document ingestion error:', error);

			// Update document status to failed if we have a document ID
			if (error.documentId) {
				await this.updateDocumentStatus(error.documentId, 'failed', error.message);
			}

			onProgress?.({
				status: 'failed',
				progress: 0,
				currentStep: 'Ingestion failed',
				errorMessage: error.message
			});

			throw error;
		}
	}

	/**
	 * Create initial document record in database
	 */
	private async createDocumentRecord(file: File, userId: string, conversationId?: string): Promise<string> {
		try {
			// Convert file to base64 for storage
			const fileBuffer = await file.arrayBuffer();
			const fileContent = Buffer.from(fileBuffer).toString('base64');

			const documentData: NewDocument = {
				userId,
				conversationId: conversationId || undefined,
				fileName: file.name,
				originalName: file.name,
				fileSize: file.size,
				mimeType: file.type,
				fileType: this.getFileType(file),
				status: 'processing',
				fileContent: fileContent
			};

			const [document] = await db.insert(documents).values(documentData).returning();
			return document.id;
		} catch (error: any) {
			console.error('Error creating document record:', error);
			throw new Error(`Failed to create document record: ${error.message}`);
		}
	}

	/**
	 * Store text chunks and their embeddings in database
	 */
	private async storeChunksAndEmbeddings(
		documentId: string,
		chunks: string[],
		embeddings: number[][],
		userId: string,
		documentMetadata: any,
		conversationId?: string
	): Promise<number> {
		try {
			const chunkRecords: NewDocumentChunk[] = [];
			let totalTokens = 0;

			for (let i = 0; i < chunks.length; i++) {
				// Estimate tokens (rough approximation: 1 token ≈ 4 characters)
				const tokenCount = Math.ceil(chunks[i].length / 4);
				totalTokens += tokenCount;

				const chunkMetadata = {
					...documentMetadata,
					chunkIndex: i,
					tokenCount,
					charCount: chunks[i].length
				};

				chunkRecords.push({
					documentId,
					userId,
					conversationId: conversationId || undefined,
					content: chunks[i],
					chunkIndex: i,
					totalChunks: chunks.length,
					embedding: embeddings[i],
					metadata: chunkMetadata
				});
			}

			// Batch insert all chunks
			console.log(`📝 Inserting ${chunkRecords.length} chunk records into database...`);
			const insertedChunks = await db.insert(documentChunks).values(chunkRecords).returning();
			console.log(`✅ Successfully inserted ${insertedChunks.length} chunks into database`);

			console.log(`Stored ${chunks.length} chunks with embeddings for document ${documentId}`);
			return totalTokens;

		} catch (error: any) {
			console.error('Error storing chunks and embeddings:', error);
			throw new Error(`Failed to store chunks and embeddings: ${error.message}`);
		}
	}

	/**
	 * Update document status and error message if applicable
	 */
	private async updateDocumentStatus(
		documentId: string,
		status: 'processing' | 'completed' | 'failed',
		errorMessage?: string
	): Promise<void> {
		try {
			await db
				.update(documents)
				.set({
					status,
					errorMessage,
					updatedAt: new Date()
				})
				.where(eq(documents.id, documentId));
		} catch (error: any) {
			console.error('Error updating document status:', error);
		}
	}

	/**
	 * Determine file type from file extension and MIME type
	 */
	private getFileType(file: File): string {
		const extension = file.name.split('.').pop()?.toLowerCase();

		// Check by MIME type first
		if (file.type === 'application/pdf') return 'pdf';
		if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') return 'docx';
		if (file.type === 'text/plain') return 'txt';

		// Fallback to extension
		switch (extension) {
			case 'pdf': return 'pdf';
			case 'docx': return 'docx';
			case 'txt': return 'txt';
			default: throw new Error(`Unsupported file type: ${extension}`);
		}
	}

	/**
	 * Get ingestion status for a document
	 */
	async getIngestionStatus(documentId: string): Promise<IngestionProgress> {
		try {
			const document = await db.query.documents.findFirst({
				where: eq(documents.id, documentId),
				columns: {
					status: true,
					errorMessage: true,
					createdAt: true,
					updatedAt: true
				}
			});

			if (!document) {
				throw new Error('Document not found');
			}

			let progress = 0;
			let currentStep = 'Unknown';

			switch (document.status) {
				case 'processing':
					progress = 50;
					currentStep = 'Processing document...';
					break;
				case 'completed':
					progress = 100;
					currentStep = 'Ingestion completed successfully!';
					break;
				case 'failed':
					progress = 0;
					currentStep = 'Ingestion failed';
					break;
			}

			return {
				status: document.status as 'processing' | 'completed' | 'failed',
				progress,
				currentStep,
				errorMessage: document.errorMessage || undefined
			};

		} catch (error: any) {
			console.error('Error getting ingestion status:', error);
			throw new Error(`Failed to get ingestion status: ${error.message}`);
		}
	}

	/**
	 * Delete document and all its chunks (cleanup)
	 */
	async deleteDocument(documentId: string, userId: string): Promise<void> {
		try {
			// Verify ownership
			const document = await db.query.documents.findFirst({
				where: eq(documents.id, documentId),
				columns: { userId: true }
			});

			if (!document || document.userId !== userId) {
				throw new Error('Document not found or access denied');
			}

			// Delete document (cascade will delete chunks and citations)
			await db.delete(documents).where(eq(documents.id, documentId));

			console.log(`Deleted document ${documentId} and all associated data`);
		} catch (error: any) {
			console.error('Error deleting document:', error);
			throw new Error(`Failed to delete document: ${error.message}`);
		}
	}
}
