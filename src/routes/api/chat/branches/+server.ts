import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';
import { getBranchVersions } from '$lib/services/chat/buildBranchAwareTranscript';

export const GET: RequestHandler = async ({ url, locals }) => {
	try {
		const messageId = url.searchParams.get('messageId');
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!messageId) {
			throw new ValidationError('Message ID is required');
		}

		// Verify the user owns the message
		const message = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.userId, session.user.id)
			)
		});

		if (!message) {
			throw new ValidationError('Message not found or access denied');
		}

		// Get all versions in the branch
		const versions = await getBranchVersions(messageId);

		return json({
			success: true,
			versions: versions,
			branchId: message.branchId || message.id
		});

	} catch (error) {
		console.error('Branches API Error:', error);
		return handleApiError(error);
	}
};
