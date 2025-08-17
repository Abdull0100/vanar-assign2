import { db } from '$lib/server/db';
import { sessions, users } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session_id');

	if (!sessionId) {
		event.locals.user = null;
		return resolve(event);
	}

	const [session] = await db
		.select()
		.from(sessions)
		.where(eq(sessions.id, sessionId));

	if (!session || session.expiresAt < new Date()) {
		event.locals.user = null;
		return resolve(event);
	}

	const [user] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.userId));

	if (!user) {
		event.locals.user = null;
		return resolve(event);
	}

	event.locals.user = {
		id: user.id,
		email: user.email,
		name: user.name,
		verified: user.verified
	};

	return resolve(event);
};
