import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { documents } from '$lib/db/schema';
import { AuthError, ValidationError } from '$lib/errors';
import { eq } from 'drizzle-orm';
import { ActivityTracker } from '$lib/activityTracker';

export const DELETE: RequestHandler = async ({ params, locals, request }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to delete documents');
		}

		const documentId = params.id;

		if (!documentId) {
			throw new ValidationError('Document ID is required');
		}

		// Check if document exists and belongs to user
		const document = await db.query.documents.findFirst({
			where: eq(documents.id, documentId)
		});

		if (!document) {
			throw new ValidationError('Document not found');
		}

		if (document.userId !== session.user.id) {
			throw new AuthError('You do not have permission to delete this document');
		}

		// Delete the document (chunks and citations will be deleted via cascade)
		await db.delete(documents).where(eq(documents.id, documentId));

		// Track document deletion activity
		try {
			const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || undefined;
			const ua = request.headers.get('user-agent') || undefined;
			await ActivityTracker.trackUserActivity(
				session.user.id,
				'document_delete',
				'User deleted a document',
				{ documentId, fileName: document.originalName },
				ip,
				ua
			);
		} catch (activityError) {
			console.warn('Failed to track document deletion activity:', activityError);
		}

		return json({
			success: true,
			message: 'Document deleted successfully'
		});

	} catch (error: any) {
		console.error('Document deletion error:', error);

		if (error instanceof AuthError || error instanceof ValidationError) {
			return json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Failed to delete document' },
			{ status: 500 }
		);
	}
};
