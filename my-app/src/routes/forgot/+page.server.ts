import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetEmail, generateVerificationToken } from '$lib/utils/email';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return fail(400, { error: 'Email is required' });
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (user) {
      // Generate secure token
      const token = generateVerificationToken();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour expiration

      // Delete any existing reset tokens for this user
      await db.delete(passwordResets).where(eq(passwordResets.userId, user.id));

      // Insert password reset record
      await db.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt
      });

      // Send email
      const emailSent = await sendPasswordResetEmail(
        user.email, 
        user.name || 'User', 
        token
      );

      if (!emailSent) {
        return fail(500, { error: 'Failed to send reset email. Please try again.' });
      }

      console.log('✅ Password reset email sent to:', user.email);
    }

    // Always return success (security: don't reveal if email exists)
    return { success: true };
  }
};
