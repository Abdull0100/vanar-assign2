import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { documents, documentChunks } from '$lib/db/schema';
import { AuthError, ValidationError } from '$lib/errors';
import { eq } from 'drizzle-orm';
import { ActivityTracker } from '$lib/activityTracker';
import { DocumentProcessor } from '$lib/services/DocumentProcessor';
import type { Document, NewDocument } from '$lib/db/schema';

// File size limits (in bytes)
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = {
	'pdf': ['application/pdf'],
	'docx': ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
	'txt': ['text/plain', 'text/markdown']
};

// Validate file type
function getFileType(mimeType: string): string | null {
	for (const [type, mimeTypes] of Object.entries(ALLOWED_FILE_TYPES)) {
		if (mimeTypes.includes(mimeType)) {
			return type;
		}
	}
	return null;
}

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to upload documents');
		}

		const contentType = request.headers.get('content-type') || '';

		if (!contentType.includes('multipart/form-data')) {
			throw new ValidationError('Request must be multipart/form-data');
		}

		const formData = await request.formData();
		const file = formData.get('file') as File | null;

		if (!file) {
			throw new ValidationError('No file provided');
		}

		// Validate file size
		if (file.size > MAX_FILE_SIZE) {
			throw new ValidationError(`File size exceeds maximum limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
		}

		// Validate file type
		const fileType = getFileType(file.type);
		if (!fileType) {
			throw new ValidationError(`Unsupported file type. Allowed types: ${Object.keys(ALLOWED_FILE_TYPES).join(', ')}`);
		}

		// Generate unique filename
		const fileExtension = fileType === 'docx' ? 'docx' : fileType;
		const uniqueFileName = `${crypto.randomUUID()}.${fileExtension}`;

		// Create document record
		const newDocument: NewDocument = {
			userId: session.user.id,
			fileName: uniqueFileName,
			originalName: file.name,
			fileSize: file.size,
			mimeType: file.type,
			fileType: fileType,
			status: 'processing'
		};

		const [document] = await db.insert(documents).values(newDocument).returning();

		// Track document upload activity
		try {
			const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
			const ua = request.headers.get('user-agent') || undefined;
			await ActivityTracker.trackUserActivity(
				session.user.id,
				'document_upload',
				'User uploaded a document',
				{ documentId: document.id, fileName: file.name, fileSize: file.size },
				ip,
				ua
			);
		} catch (activityError) {
			console.warn('Failed to track document upload activity:', activityError);
		}

		// Process document in background
		processDocument(document, file).catch(error => {
			console.error('Document processing failed:', error);
			// Update document status to failed
			db.update(documents)
				.set({
					status: 'failed',
					errorMessage: error.message,
					updatedAt: new Date()
				})
				.where(eq(documents.id, document.id))
				.catch(dbError => console.error('Failed to update document status:', dbError));
		});

		return json({
			success: true,
			document: {
				id: document.id,
				fileName: document.originalName,
				fileSize: document.fileSize,
				fileType: document.fileType,
				status: document.status,
				createdAt: document.createdAt
			}
		});

	} catch (error: any) {
		console.error('Document upload error:', error);

		if (error instanceof AuthError || error instanceof ValidationError) {
			return json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Failed to upload document' },
			{ status: 500 }
		);
	}
};

// Background document processing
async function processDocument(document: Document, file: File) {
	try {
		console.log(`Processing document: ${document.id} (${document.originalName})`);

		// Extract text from file
		const documentProcessor = new DocumentProcessor();
		const extractedText = await documentProcessor.extractText(file, document.fileType);

		// Update document with extracted text
		await db.update(documents)
			.set({
				extractedText: extractedText,
				status: 'completed',
				updatedAt: new Date()
			})
			.where(eq(documents.id, document.id));

		// Create text chunks for RAG
		const chunks = documentProcessor.createChunks(extractedText, 1000, 200); // 1000 char chunks with 200 overlap

		// Generate embeddings for all chunks at once
		const embeddings = await documentProcessor.generateEmbeddingsForChunks(chunks);

		// Create chunk records with embeddings
		const chunkRecords = chunks.map((chunk, i) => ({
			documentId: document.id,
			userId: document.userId,
			content: chunk,
			chunkIndex: i,
			totalChunks: chunks.length,
			embedding: embeddings[i],
			metadata: {
				charStart: i * 800, // Approximate position
				charEnd: (i + 1) * 800
			}
		}));

		// Insert chunks in batches
		if (chunkRecords.length > 0) {
			await db.insert(documentChunks).values(chunkRecords);
		}

		console.log(`Document processing completed: ${document.id}, created ${chunks.length} chunks`);

	} catch (error: any) {
		console.error(`Document processing failed for ${document.id}:`, error);
		throw error;
	}
}


