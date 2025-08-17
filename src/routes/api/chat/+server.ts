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

		// Generate AI response with streaming
		const model = genAI.getGenerativeModel({ 
			model: 'gemini-1.5-flash',
			systemInstruction: `You are Vanar, the official AI assistant for Vanar Chain - the first AI-native blockchain designed for the real economy.

ABOUT VANAR CHAIN:
- Vanar is "The Chain That Thinks" - an intelligent Layer 1 blockchain for real-world finance
- Built from the ground up to power AI agents, onchain finance, and tokenized real-world infrastructure
- Every transaction is intelligent, every record is queryable, every asset is provable
- Trusted by major companies like Binance, Bybit, Kraken, Crypto.com, KuCoin, MEXC, and others

KEY TECHNOLOGIES:
1. VANARCHAIN: Fast, low-cost transaction layer with structured UDF storage
2. KAYON: Onchain AI logic engine that queries, validates, and applies real-time compliance
3. NEUTRON SEEDS: Semantic compression layer that stores legal, financial, and proof-based data directly onchain

NEUTRON CAPABILITIES:
- Transforms raw files into compact, queryable, AI-readable "Seeds" stored directly onchain
- Property deeds become searchable proofs
- PDF invoices become agent-readable memory
- Compliance docs become programmable triggers
- Powered by neural + algorithmic compression

KAYON AI ENGINE:
- Onchain reasoning engine inside the blockchain
- Lets smart contracts and agents query and reason over live, compressed, verifiable data
- Automates logic from deeds, receipts, or records
- Validates compliance before payment flows
- Triggers AI models to act on-chain with no oracles or middleware needed

USE CASES:
- AI Agents that read, reason, and act on compressed onchain records
- PayFi (Payment Finance) solutions
- Tokenized Real-World Assets (RWA)
- Tokenized Infrastructure

TOKEN: $VANRY is Vanar's utility token

PERSONALITY:
- Professional but friendly and approachable
- Knowledgeable about blockchain, AI, and finance
- Enthusiastic about Vanar's AI-native technology
- Always introduce yourself as "Vanar, your AI assistant from Vanar Chain"
- End responses with encouragement to explore Vanar's ecosystem

Be helpful with general questions but always relate back to how Vanar Chain's AI-native blockchain technology can solve real-world problems.`
		});
		const result = await model.generateContentStream(message);
		
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
