import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const actions = {
  login: async ({ request, cookies }) => {
    const formData = await request.formData();
    const email = formData.get('email');
    const password = formData.get('password');

    if (!email || !password) {
      return fail(400, { error: 'Email and password are required' });
    }

    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return fail(400, { error: 'Invalid email or password' });
    }

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [session] = await db.insert(sessions).values({
      userId: user.id,
      expiresAt
    }).returning();

    cookies.set('session_id', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    throw redirect(302, '/');
  }
};
