import { fail, redirect } from '@sveltejs/kit';
import { getDb } from '$lib/server/db';
import { users, emailVerifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sendVerificationOTP, generateOTP } from '$lib/utils/email';

export const actions = {
  signup: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;
    const name = formData.get('name') as string;
    const password = formData.get('password') as string;

    // Validate input
    if (!email || !password) {
      return fail(400, { 
        error: 'Email and password are required',
        email,
        name
      });
    }

    if (password.length < 6) {
      return fail(400, { 
        error: 'Password must be at least 6 characters long',
        email,
        name
      });
    }

    const db = getDb();
    
    // Check if email already exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email)
    });
    if (existingUser) {
      return fail(400, { 
        error: 'Email already in use',
        email,
        name
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user (unverified by default)
    const [newUser] = await db.insert(users).values({
      email,
      name,
      passwordHash,
      verified: false,
      role: 'user', // Default role
      provider: 'email' // Mark as email/password user
    }).returning();

    // Generate 6-digit OTP
    const otp = generateOTP();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 1); // 1 hour expiration

    // Delete any existing verification tokens for this user
    await db.delete(emailVerifications).where(eq(emailVerifications.userId, newUser.id));

    // Insert verification record with OTP as token
    await db.insert(emailVerifications).values({
      userId: newUser.id,
      token: otp, // Store OTP as token
      expiresAt: verificationExpiresAt
    });

    // Send verification OTP email
    const emailSent = await sendVerificationOTP(email, name || 'User', otp);
    
    if (!emailSent) {
      // If email fails, clean up the user and token
      await db.delete(users).where(eq(users.id, newUser.id));
      return fail(500, { 
        error: 'Failed to send verification OTP. Please try again.',
        email,
        name
      });
    }

    // Redirect to verification pending page
    throw redirect(302, '/signup/success');
  }
};
