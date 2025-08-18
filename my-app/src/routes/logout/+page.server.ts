import { redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';

export const load = async ({ locals }) => {
  if (!locals.user) {
    throw redirect(302, '/login');
  }

  return {
    user: locals.user
  };
};

export const actions = {
	default: async ({ cookies }) => {
		const sessionId = cookies.get('session');
		if (sessionId) {
			const db = getDb();
			await db.delete(sessions).where(eq(sessions.id, sessionId));
		}
		cookies.delete('session', { path: '/' });
		// Redirect directly to login with success message
		throw redirect(302, '/login?logout=success');
	}
};
