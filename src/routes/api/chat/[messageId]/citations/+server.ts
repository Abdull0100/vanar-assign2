import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { citations, chatMessages } from '$lib/db/schema';
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

		// Verify the chat message belongs to the user (could be user or assistant message)
		const chatMessage = await db.query.chatMessages.findFirst({
			where: and(
				eq(chatMessages.id, messageId),
				eq(chatMessages.userId, session.user.id)
			),
			columns: { id: true, role: true, conversationId: true }
		});

		console.log('Citation API called for messageId:', messageId, 'userId:', session.user.id);
		console.log('Looking for message with ID:', messageId);

		// First, let's see all messages for this user to debug
		const allUserMessages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.userId, session.user.id),
			columns: { id: true, role: true, createdAt: true },
			orderBy: desc(chatMessages.createdAt),
			limit: 5
		});
		console.log('Recent messages for user:', allUserMessages.map(m => ({ id: m.id, role: m.role })));

		console.log('Found chat message:', chatMessage ? `role: ${chatMessage.role}, conversationId: ${chatMessage.conversationId}` : 'NOT FOUND');

		if (!chatMessage) {
			// Let's also check if the message exists at all (without user filter) for debugging
			const messageExists = await db.query.chatMessages.findFirst({
				where: eq(chatMessages.id, messageId),
				columns: { id: true, userId: true, role: true }
			});
			console.log('Message exists in DB:', messageExists ? `userId: ${messageExists.userId}, role: ${messageExists.role}` : 'NOT FOUND AT ALL');
			
			// Return empty citations instead of throwing error for non-existent messages
			return json({
				success: true,
				citations: []
			});
		}

		// First check if any citations exist for this message
		const citationCount = await db.query.citations.findFirst({
			where: eq(citations.chatMessageId, messageId),
			columns: { id: true }
		});

		// If no citations exist, return empty array immediately
		if (!citationCount) {
			console.log(`No citations found for message ${messageId} - returning empty array`);
			return json({
				success: true,
				citations: []
			});
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

		console.log(`Found ${messageCitations.length} citations for message ${messageId}`);

		return json({
			success: true,
			citations: messageCitations.map(citation => ({
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
			return json(
				{ success: false, error: error.message },
				{ status: 400 }
			);
		}

		return json(
			{ success: false, error: 'Failed to fetch citations' },
			{ status: 500 }
		);
	}
};
