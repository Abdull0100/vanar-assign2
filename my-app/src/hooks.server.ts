import { db } from '$lib/server/db'; 
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

// helper to detect redirect objects
function isRedirect(e: unknown): e is { status: number; location: string } {
	return !!e && typeof e === 'object' && 'status' in e && 'location' in e;
}

export const handle: Handle = async ({ event, resolve }) => {
	try {
		const sessionId = event.cookies.get('session_id');

		if (!sessionId) {
			event.locals.user = null;
			return await resolve(event);
		}

		const [session] = await db
			.select()
			.from(sessions)
			.where(eq(sessions.id, sessionId));

		if (!session || session.expiresAt < new Date()) {
			event.locals.user = null;
			return await resolve(event);
		}

		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, session.userId));

		if (!user) {
			event.locals.user = null;
			return await resolve(event);
		}

		event.locals.user = {
			id: user.id,
			email: user.email,
			name: user.name,
			verified: user.verified
		};

		return await resolve(event);
	} catch (e) {
		// 👇 ignore redirects so they don’t get logged as errors
		if (isRedirect(e)) throw e;

		console.error('Unhandled error in hooks.server.ts:', e);
		throw e;
	}
};
