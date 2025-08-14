import type { Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const handle: Handle = async ({ event, resolve }) => {
  // Read session ID from cookies
  const sessionId = event.cookies.get('session_id');

  if (sessionId) {
    // Look up the session in the database
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId));

    if (session && session.expiresAt > new Date()) {
      // Fetch the user linked to this session
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId));

      if (user) {
        event.locals.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          verified: user.verified
        };
      }
    }
  }

  // Continue with the request
  return resolve(event);
};
