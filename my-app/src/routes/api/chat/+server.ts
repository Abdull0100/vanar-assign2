import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { GoogleGenerativeAI } from '@google/generative-ai';

export const POST: RequestHandler = async ({ request }) => {
	try {
		// Parse the request body
		const { messages } = await request.json();

		// Validate input
		if (!messages || !Array.isArray(messages)) {
			return json({ error: 'Invalid messages format' }, { status: 400 });
		}

		// Get API key
		const apiKey = env.GOOGLE_GENERATIVE_AI_API_KEY;
		if (!apiKey) {
			return json(
				{ error: 'Google Generative AI API key not configured' },
				{ status: 500 }
			);
		}

		// Initialize Google Generative AI client
		const genAI = new GoogleGenerativeAI(apiKey);

		// Use gemini-1.5-flash (fast) or gemini-1.5-pro (more powerful)
		const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

		// Convert messages into a single prompt
		const prompt = messages
			.map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
			.join('\n');

		// Generate response
		const result = await model.generateContent(prompt);
		const text = result.response.text();

		return json({ reply: text });
	} catch (error: any) {
		console.error('Chat API error:', error);

		if (error.status === 401 || error.status === 403) {
			return json({ error: 'Invalid API key' }, { status: 500 });
		}

		if (error.status === 404) {
			return json(
				{ error: 'AI model not available. Please check your API configuration.' },
				{ status: 500 }
			);
		}

		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
