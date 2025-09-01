import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { documents } from '$lib/db/schema';
import { AuthError, ValidationError } from '$lib/errors';
import { eq, and } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to download documents');
		}

		const documentId = params.id;
		if (!documentId) {
			throw new ValidationError('Document ID is required');
		}

		// Find the document and verify ownership
		const document = await db.query.documents.findFirst({
			where: and(eq(documents.id, documentId), eq(documents.userId, session.user.id)),
			columns: {
				id: true,
				fileName: true,
				originalName: true,
				fileType: true,
				mimeType: true,
				status: true,
				extractedText: true,
				fileContent: true
			}
		});

		if (!document) {
			throw new ValidationError('Document not found or access denied');
		}

		if (document.status !== 'completed') {
			throw new ValidationError('Document is not ready for download');
		}

		// Check if we have file content stored
		if (!document.fileContent) {
			throw new ValidationError('File content not available for download');
		}

		// Convert base64 back to binary
		const fileBuffer = Buffer.from(document.fileContent, 'base64');

		// Return the file with proper headers
		const response = new Response(fileBuffer, {
			headers: {
				'Content-Type': document.mimeType || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${document.originalName}"`,
				'Content-Length': fileBuffer.length.toString(),
				'Cache-Control': 'no-cache'
			}
		});
		return response;
	} catch (error: any) {
		console.error('Document download error:', error);

		if (error instanceof AuthError || error instanceof ValidationError) {
			return json({ success: false, error: error.message }, { status: 400 });
		}

		return json({ success: false, error: 'Failed to download document' }, { status: 500 });
	}
};
