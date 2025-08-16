import { json, type RequestHandler } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq } from 'drizzle-orm';
import { AuthError, ValidationError, handleApiError } from '$lib/errors';

// Initialize Gemini AI only if API key is available
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

export const POST: RequestHandler = async ({ request, locals }) => {
	try {
		const { message } = await request.json();
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

		// Generate AI response
		const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
		const result = await model.generateContent(message);
		const response = result.response.text();

		// Save to database
		await db.insert(chatMessages).values({
			userId: session.user.id,
			message,
			response
		});

		return json({ response });
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
