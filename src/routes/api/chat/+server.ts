import { json } from '@sveltejs/kit';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '$lib/db';
import { chatMessages } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST({ request, locals }) {
  try {
    const { message } = await request.json();
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!message || typeof message !== 'string') {
      return json({ error: 'Message is required' }, { status: 400 });
    }

    // Generate AI response
    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
    const result = await model.generateContent(message);
    const response = result.response.text();

    // Save to database
    await db.insert(chatMessages).values({
      userId: session.user.id,
      message,
      response,
    });

    return json({ response });
  } catch (error) {
    console.error('Chat API error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET({ locals }) {
  try {
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get chat history for the user
    const messages = await db.query.chatMessages.findMany({
      where: eq(chatMessages.userId, session.user.id),
      orderBy: (chatMessages, { desc }) => [desc(chatMessages.createdAt)],
      limit: 50,
    });

    return json({ messages });
  } catch (error) {
    console.error('Get chat history error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
