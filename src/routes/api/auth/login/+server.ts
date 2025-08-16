import { json, type RequestHandler } from '@sveltejs/kit';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '$lib/db';
import { users, sessions } from '$lib/db/schema';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request, cookies }) => {
	try {
		const { email, password } = await request.json();

		if (!email || !password) {
			return json({ error: 'Email and password are required' }, { status: 400 });
		}

		// Find user by email
		const user = await db.query.users.findFirst({
			where: eq(users.email, email.toLowerCase())
		});

		if (!user?.password) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		// Verify password
		const isValid = await bcrypt.compare(password, user.password);
		if (!isValid) {
			return json({ error: 'Invalid email or password' }, { status: 401 });
		}

		// Create session
		const sessionToken = crypto.randomUUID();
		const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(sessions).values({
			sessionToken,
			userId: user.id,
			expires
		});

		// Set session cookie
		cookies.set('next-auth.session-token', sessionToken, {
			expires,
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			path: '/'
		});

		return json({ 
			success: true, 
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role
			}
		});

	} catch (error) {
		console.error('Login error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
