import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET({ locals }) {
  try {
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all users
    const allUsers = await db.query.users.findMany({
      orderBy: (users, { desc }) => [desc(users.createdAt)],
    });

    return json({ users: allUsers });
  } catch (error) {
    console.error('Get users error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
