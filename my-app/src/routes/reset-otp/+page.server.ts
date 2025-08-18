import { fail, redirect } from '@sveltejs/kit';
import { dbClient } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq, and, gt } from 'drizzle-orm';
import bcrypt from 'bcrypt';

export const actions = {
  default: async ({ request, url }) => {
    const formData = await request.formData();
    const otp = formData.get('otp') as string;
    const newPassword = formData.get('newPassword') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Validation
    if (!otp || !newPassword || !confirmPassword) {
      return fail(400, { error: 'All fields are required' });
    }

    if (newPassword !== confirmPassword) {
      return fail(400, { error: 'Passwords do not match' });
    }

    if (newPassword.length < 6) {
      return fail(400, { error: 'Password must be at least 6 characters' });
    }

    if (!/^\d{6}$/.test(otp)) {
      return fail(400, { error: 'Invalid OTP format' });
    }

    try {
      // Find the password reset record
             const [resetRecord] = await dbClient
         .select()
         .from(passwordResets)
         .where(
           and(
             eq(passwordResets.otp, otp),
             gt(passwordResets.expiresAt, new Date())
           )
         );

      if (!resetRecord) {
        return fail(400, { error: 'Invalid or expired OTP code' });
      }

      // Get user details
             const [user] = await dbClient
         .select()
         .from(users)
         .where(eq(users.id, resetRecord.userId));

      if (!user) {
        return fail(400, { error: 'User not found' });
      }

      // Hash the new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update user's password
             await dbClient
         .update(users)
         .set({ 
           passwordHash,
           updatedAt: new Date()
         })
         .where(eq(users.id, user.id));

      // Delete the used OTP
             await dbClient
         .delete(passwordResets)
         .where(eq(passwordResets.id, resetRecord.id));

      console.log('✅ Password reset successful for:', user.email);

      // Redirect to login with success message
      throw redirect(302, '/login?reset=success');

    } catch (error) {
      console.error('❌ Password reset error:', error);
      if (error instanceof Response) {
        throw error;
      }
      return fail(500, { error: 'Failed to reset password. Please try again.' });
    }
  }
};
