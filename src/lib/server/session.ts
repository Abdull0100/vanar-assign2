// src/lib/server/session.ts
// Deprecated: Prefer Auth.js sessions. Kept only for backward compatibility with legacy code.
// Note: Role-based access is enforced via Auth.js session callback, not here.

import { db } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { randomBytes } from 'crypto';
import { add } from 'date-fns';
import { eq } from 'drizzle-orm';

const SESSION_DURATION_DAYS = 7;

// WARNING: This conflicts with Auth.js sessions table structure
// Consider removing this file and using Auth.js session management exclusively

export async function createSession(userId: string): Promise<string> {
  const sessionToken = randomBytes(32).toString('hex');
  const expires = add(new Date(), { days: SESSION_DURATION_DAYS });

  // Fix: Use correct schema structure
  await db.insert(sessions).values({ 
    sessionToken, // Not 'id'
    userId, 
    expires // Not 'expiresAt'
  });
  return sessionToken; // Return sessionToken, not id
}

export async function getSession(sessionToken: string) {
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.sessionToken, sessionToken)); // Not sessions.id

  if (!session || new Date() > session.expires) { // Not session.expiresAt
    return null;
  }

  return session; // Return full session, not session.userData
}

export async function deleteSession(sessionToken: string) {
  await db.delete(sessions).where(eq(sessions.sessionToken, sessionToken)); // Not sessions.id
}
