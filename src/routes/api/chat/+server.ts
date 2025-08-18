import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';

// Import env vars from $env
import { GEMINI_API_KEY } from '$env/static/private';

// Initialize Gemini AI only if API key is available
const genAI = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

type HistoryTurn = { message: string; response: string };

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const body = await request.json();
		const message: string = body.message;
		const history: HistoryTurn[] | undefined = Array.isArray(body.history) ? body.history : undefined;
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to use the chat feature');
		}

		if (!message || typeof message !== 'string') {
			throw new ValidationError('Message is required and must be a valid string');
		}

		// Check if Gemini API is available
		if (!genAI) {
			return json({ 
				response: "I apologize, but the AI chat service is currently unavailable. The Gemini API key is not configured. Please contact your administrator to set up the GEMINI_API_KEY environment variable." 
			});
		}

		// Build conversation transcript from history (limit to recent turns)
		let transcript = '';
		if (history && history.length > 0) {
			const recent = history.slice(-20); // keep last 20 pairs
			for (const turn of recent) {
				if (turn.message) transcript += `User: ${turn.message}\n`;
				if (turn.response) transcript += `Vanar: ${turn.response}\n`;
			}
		}

		const systemInstruction = `You are Vanar, an advanced AI Chat Bot similar to Gemini and ChatGPT.

Persona and behavior:
- Behave like a professional, friendly, and knowledgeable chatbot.
- Be adaptive: casual tone for casual chats, professional tone for work queries.
- Support coding help, explanations, brainstorming, and research.
- Remember context within the current conversation transcript provided.
- If asked "Who are you?", always reply exactly: "I am Vanar, your AI assistant.".

Capabilities:
- Provide clear, concise, and professional answers.
- You can continue a conversation from earlier points using the provided transcript.
- Prefer structured, skimmable responses when helpful.
`;

		// Compose the final prompt including transcript and the new user message
		const prompt = `${transcript ? `Conversation so far:\n${transcript}\n` : ''}User: ${message}\nVanar:`;

		// Generate AI response with streaming
		const model = genAI.getGenerativeModel({ 
			model: 'gemini-1.5-flash',
			systemInstruction
		});
		const result = await model.generateContentStream(prompt);
		
		let fullResponse = '';
		
		// Create a readable stream for the response
		const stream = new ReadableStream({
			async start(controller) {
				try {
					for await (const chunk of result.stream) {
						const chunkText = chunk.text();
						fullResponse += chunkText;
						// Send each chunk to the client
						const data = JSON.stringify({ 
							chunk: chunkText, 
							done: false 
						});
						controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`));
					}
					// Send completion signal
					const endData = JSON.stringify({ 
						chunk: '', 
						done: true,
						fullResponse 
					});
					controller.enqueue(new TextEncoder().encode(`data: ${endData}\n\n`));
					// Save complete response to database
					await db.insert(chatMessages).values({
						userId: session.user!.id,
						message,
						response: fullResponse
					});
					controller.close();
				} catch (error) {
					console.error('Streaming error:', error);
					const errorData = JSON.stringify({ 
						error: 'Failed to generate response',
						done: true 
					});
					controller.enqueue(new TextEncoder().encode(`data: ${errorData}\n\n`));
					controller.close();
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/event-stream',
				'Cache-Control': 'no-cache',
				'Connection': 'keep-alive',
				'Access-Control-Allow-Origin': '*',
				'Access-Control-Allow-Headers': 'Content-Type',
			}
		});
	} catch (error) {
		handleApiError(error);
	}
}

export const GET: RequestHandler = async ({ locals }) => {
	try {
		const session = await locals.getSession?.();

		if (!session?.user?.id) {
			throw new AuthError('Please sign in to view chat history');
		}

		// Get chat history for the user
		const messages = await db.query.chatMessages.findMany({
			where: eq(chatMessages.userId, session.user.id),
			orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)],
			limit: 50
		});

		return json({ messages });
	} catch (error) {
		handleApiError(error);
	}
}
