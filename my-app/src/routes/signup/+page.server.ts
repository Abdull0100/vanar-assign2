import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions, emailVerifications } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { sendVerificationEmail } from '$lib/utils/email';
import { randomUUID } from 'crypto';

export const actions = {
  signup: async ({ request, cookies }) => {
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

    // Check if email already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email));
    if (existingUser.length > 0) {
      return fail(400, { 
        error: 'Email already in use',
        email,
        name
      });
    }

    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create the user
    const [newUser] = await db.insert(users).values({
      email,
      name,
      passwordHash,
      verified: false
    }).returning();

    // Create verification token
    const verificationToken = randomUUID();
    const verificationExpiresAt = new Date();
    verificationExpiresAt.setHours(verificationExpiresAt.getHours() + 24);

    // Insert verification record
    await db.insert(emailVerifications).values({
      userId: newUser.id,
      token: verificationToken,
      expiresAt: verificationExpiresAt
    });

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    // Create a session for the new user
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const [session] = await db.insert(sessions).values({
      userId: newUser.id,
      expiresAt
    }).returning();

    // Set the session cookie
    cookies.set('session_id', session.id, {
      path: '/',
      httpOnly: true,
      sameSite: 'strict',
      secure: false,
      maxAge: 7 * 24 * 60 * 60 // 7 days in seconds
    });

    // Redirect to home page
    throw redirect(302, '/');
  }
};
