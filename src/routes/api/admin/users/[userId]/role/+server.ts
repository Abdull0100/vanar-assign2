import { json } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users } from '$lib/db/schema';
import { eq } from 'drizzle-orm';

export async function PATCH({ request, params, locals }) {
  try {
    const session = await locals.getSession();

    if (!session?.user?.id) {
      return json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return json({ error: 'Forbidden' }, { status: 403 });
    }

    const { role } = await request.json();
    const { userId } = params;

    if (!role || !['user', 'admin'].includes(role)) {
      return json({ error: 'Invalid role' }, { status: 400 });
    }

    // Update user role
    await db.update(users)
      .set({ role })
      .where(eq(users.id, userId));

    return json({ message: 'User role updated successfully' });
  } catch (error) {
    console.error('Update user role error:', error);
    return json({ error: 'Internal server error' }, { status: 500 });
  }
}
