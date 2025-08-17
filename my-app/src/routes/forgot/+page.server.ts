import { fail } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, passwordResets } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { sendPasswordResetEmail } from '$lib/utils/email';

export const actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    if (!email) {
      return fail(400, { success: false });
    }

    // Find user by email
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (user) {
      // Generate token
      const token = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1);

      // Insert password reset record
      await db.insert(passwordResets).values({
        userId: user.id,
        token,
        expiresAt
      });

      // Send email
      await sendPasswordResetEmail(email, token);
    }

    // Always return success
    return { success: true };
  }
};
