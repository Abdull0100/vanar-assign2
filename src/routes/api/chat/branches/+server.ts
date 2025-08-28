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

		// First, try to find the message directly
		let message = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.userId, session.user.id)
			)
		});

		// If not found, check if it's a forked message and try to find the original
		if (!message) {
			// Look for messages that might be related to this messageId
			const relatedMessages = await db.query.chatMessages.findMany({
				where: and(
					eq(chatMessages.userId, session.user.id),
					eq(chatMessages.originalMessageId, messageId)
				)
			});

			if (relatedMessages.length > 0) {
				// Use the first related message to get branch info
				message = relatedMessages[0];
			} else {
				// Check if this messageId is actually a branchId
				const branchMessage = await db.query.chatMessages.findFirst({
					where: and(
						eq(chatMessages.branchId, messageId),
						eq(chatMessages.userId, session.user.id)
					)
				});

				if (branchMessage) {
					message = branchMessage;
				} else {
					// Instead of throwing an error, return empty versions
					// This prevents the API from failing when messages don't have branches
					return json({
						success: true,
						versions: [],
						branchId: null
					});
				}
			}
		}

		// Determine the correct branch ID
		const branchId = message.branchId || message.id;
		
		// Get all versions in the branch
		const versions = await getBranchVersions(branchId);

		return json({
			success: true,
			versions: versions,
			branchId: branchId
		});

	} catch (error) {
		console.error('Branches API Error:', error);
		return handleApiError(error);
	}
};
