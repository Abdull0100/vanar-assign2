import { fail } from '@sveltejs/kit';
import { dbClient } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { sendPasswordResetOTP, generateOTP } from '$lib/utils/email';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return fail(400, { error: 'Email is required' });
    }

    // Find user by email
    		const [user] = await dbClient.select().from(users).where(eq(users.email, email));

    if (user) {
      // Generate 6-digit OTP
      const otp = generateOTP();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours expiration

      // Delete any existing reset OTPs for this user
      		await dbClient.delete(passwordResets).where(eq(passwordResets.userId, user.id));

      // Insert password reset record
      		await dbClient.insert(passwordResets).values({
        userId: user.id,
        otp,
        expiresAt
      });

      // Send email
      console.log('📧 About to send OTP email...');
      console.log('📧 User email:', user.email);
      console.log('📧 Generated OTP:', otp);
      
      const emailSent = await sendPasswordResetOTP(
        user.email, 
        user.name || 'User', 
        otp
      );

      if (!emailSent) {
        console.log('❌ Email sending failed');
        return fail(500, { error: 'Failed to send OTP email. Please try again.' });
      }

      console.log('✅ Password reset OTP sent to:', user.email);
      console.log('✅ Email sending completed successfully');
    }

    // Always return success (security: don't reveal if email exists)
    return { success: true };
  }
};
