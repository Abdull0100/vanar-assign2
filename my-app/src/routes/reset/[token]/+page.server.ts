import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const load = async ({ params }) => {
  const { token } = params;
  if (!token) {
    return { error: 'Invalid or expired reset link' };
  }

  const [reset] = await db
    .select()
    .from(passwordResets)
    .where(and(eq(passwordResets.token, token), gt(passwordResets.expiresAt, new Date())));

  if (!reset) {
    return { error: 'Invalid or expired reset link' };
  }

  return { token };
};

export const actions = {
  default: async ({ request, params }) => {
    const { token } = params;
    const formData = await request.formData();
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validate token
    const [reset] = await db
      .select()
      .from(passwordResets)
      .where(and(eq(passwordResets.token, token), gt(passwordResets.expiresAt, new Date())));

    if (!reset) {
      return fail(400, { error: 'Invalid or expired reset link' });
    }

    if (!password || password.length < 8) {
      return fail(400, { error: 'Password must be at least 8 characters long' });
    }

    if (password !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    // Hash password and update user
    const passwordHash = await bcrypt.hash(password, 10);
    await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, reset.userId));

    // Delete password reset token
    await db.delete(passwordResets).where(eq(passwordResets.id, reset.id));

    // Redirect to login with success message
    throw redirect(302, '/login?reset=success');
  }
};
