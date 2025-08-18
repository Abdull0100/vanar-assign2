import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export async function POST({ cookies }) {
  const sessionId = cookies.get('session');

  if (sessionId) {
    const db = getDb();
    await db.delete(sessions).where(eq(sessions.id, sessionId));
    cookies.delete('session', { path: '/' });
  }

  throw redirect(302, '/login');
}
