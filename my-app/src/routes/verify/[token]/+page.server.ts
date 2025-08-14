import { error } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';

export const load = async ({ params }) => {
  const { token } = params;

  if (!token) {
    throw error(400, 'Invalid verification link');
  }

  try {
    // Look up the verification token
    const [verification] = await db
      .select()
      .from(emailVerifications)
      .where(
        and(
          eq(emailVerifications.token, token),
          gt(emailVerifications.expiresAt, new Date())
        )
      );

    if (!verification) {
      return {
        success: false,
        message: 'Invalid or expired verification link'
      };
    }

    // Update user to verified
    await db
      .update(users)
      .set({ verified: true })
      .where(eq(users.id, verification.userId));

    // Delete the verification record
    await db
      .delete(emailVerifications)
      .where(eq(emailVerifications.id, verification.id));

    return {
      success: true,
      message: 'Email verified successfully!'
    };
  } catch (err) {
    console.error('Verification error:', err);
    return {
      success: false,
      message: 'Invalid or expired verification link'
    };
  }
};
