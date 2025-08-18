import type { Handle } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import { config } from 'dotenv';

// Load environment variables
config();

// helper to detect redirect objects
function isRedirect(e: unknown): e is { status: number; location: string } {
	return !!e && typeof e === 'object' && 'status' in e && 'location' in e;
}

export const handle: Handle = async ({ event, resolve }) => {
	try {
		// Get session ID from cookies (unified cookie name)
		const sessionId = event.cookies.get('session');
		
		if (sessionId) {
			try {
				const db = getDb();
				
				// Find valid session
				const session = await db.query.sessions.findFirst({
					where: and(
						eq(sessions.id, sessionId),
						gt(sessions.expiresAt, new Date())
					)
				});

				if (session) {
					// Get user data with role
					const user = await db.query.users.findFirst({
						where: eq(users.id, session.userId)
					});

					if (user && !user.disabled) {
						// Store complete user data including role in locals
						(event.locals as any).user = {
							id: user.id,
							email: user.email,
							name: user.name,
							role: user.role, // This is crucial for role-based access
							verified: user.verified,
							provider: user.provider,
							disabled: user.disabled
						};
						
						console.log(`🔐 User authenticated: ${user.email} (Role: ${user.role})`);
					}
				}
			} catch (error) {
				console.error('Error in session authentication:', error);
				// Clear invalid session
				event.cookies.delete('session', { path: '/' });
			}
		}

		// If no valid session, set user to null
		if (!(event.locals as any).user) {
			(event.locals as any).user = null;
		}
		
		return await resolve(event);
	} catch (e) {
		// 👇 ignore redirects so they don't get logged as errors
		if (isRedirect(e)) throw e;

		console.error('Unhandled error in hooks.server.ts:', e);
		throw e;
	}
};
