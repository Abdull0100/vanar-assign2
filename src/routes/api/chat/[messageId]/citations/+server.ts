import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { citations, chatMessages, conversations } from '$lib/db/schema';
import { AuthError, ValidationError } from '$lib/errors';
import { eq, and, desc } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to view citations');
		}

		const messageId = params.messageId;
		console.log('Citation API called for messageId:', messageId, 'userId:', session.user.id);

		if (!messageId) {
			throw new ValidationError('Message ID is required');
		}

		// Verify the chat message belongs to the user's conversation (could be user or assistant message)
		const chatMessage = await db.query.chatMessages.findFirst({
			where: eq(chatMessages.id, messageId),
			columns: { id: true, role: true, conversationId: true, userId: true }
		});

		console.log('Found chat message:', chatMessage);

		// Check if the message exists and belongs to a conversation owned by the user
		if (!chatMessage) {
			console.log('No chat message found for ID:', messageId);
			throw new ValidationError('Chat message not found or access denied');
		}

		// For user messages, verify direct ownership
		if (chatMessage.role === 'user' && chatMessage.userId !== session.user.id) {
			console.log(
				'User message access denied - userId mismatch:',
				chatMessage.userId,
				'vs',
				session.user.id
			);
			throw new ValidationError('Chat message not found or access denied');
		}

		// For assistant messages, verify the conversation belongs to the user
		if (chatMessage.role === 'assistant') {
			const conversation = await db.query.conversations.findFirst({
				where: and(
					eq(conversations.id, chatMessage.conversationId),
					eq(conversations.userId, session.user.id)
				),
				columns: { id: true }
			});

			console.log('Assistant message conversation check:', conversation);

			if (!conversation) {
				console.log('Assistant message access denied - conversation not owned by user');
				throw new ValidationError('Chat message not found or access denied');
			}
		}

		// Get citations for the message
		const messageCitations = await db.query.citations.findMany({
			where: eq(citations.chatMessageId, messageId),
			with: {
				document: {
					columns: {
						id: true,
						originalName: true,
						fileType: true
					}
				}
			},
			orderBy: (citations, { desc }) => [desc(citations.relevanceScore)]
		});

		return json({
			success: true,
			citations: messageCitations.map((citation) => ({
				id: citation.id,
				documentId: citation.documentId,
				documentName: citation.document.originalName,
				fileType: citation.document.fileType,
				chunkIds: citation.chunkIds,
				relevanceScore: citation.relevanceScore,
				citationText: citation.citationText,
				pageNumber: citation.pageNumber,
				section: citation.section,
				createdAt: citation.createdAt
			}))
		});
	} catch (error: any) {
		console.error('Citations fetch error:', error);

		if (error instanceof AuthError || error instanceof ValidationError) {
			return json({ success: false, error: error.message }, { status: 400 });
		}

		return json({ success: false, error: 'Failed to fetch citations' }, { status: 500 });
	}
};
