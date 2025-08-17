import { fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { users, sessions } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const verified = url.searchParams.get('verified') === 'true';
	const reset = url.searchParams.get('reset') === 'success';
	return { verified, reset };
};

export const actions = {
	login: async ({ request, cookies }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		if (!email || !password) {
			return fail(400, { error: 'Email and password are required' });
		}

		const [user] = await db.select().from(users).where(eq(users.email, email));

		if (!user) {
			return fail(400, { error: 'Invalid email or password' });
		}

		// Check if user is verified (only for email/password users, not OAuth)
		if (user.provider === 'email' && !user.verified) {
			return fail(400, { 
				error: 'Please verify your email before logging in. Check your inbox for a verification link.',
				email 
			});
		}

		const validPassword = await bcrypt.compare(password, user.passwordHash || '');
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

		throw redirect(302, '/dashboard');
	}
};
