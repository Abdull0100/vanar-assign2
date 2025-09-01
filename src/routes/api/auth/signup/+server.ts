import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { users, verificationTokens } from '$lib/db/schema';
import bcrypt from 'bcryptjs';
import { sendVerificationEmail } from '$lib/email';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const { name, email, password } = await request.json();

		if (!name || !email || !password) {
			return json({ error: 'Missing required fields' }, { status: 400 });
		}

		if (password.length < 8) {
			return json({ error: 'Password must be at least 8 characters long' }, { status: 400 });
		}

		// Check if user already exists
		const existingUser = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (existingUser) {
			return json({ error: 'User with this email already exists' }, { status: 409 });
		}

		// Hash password
		const hashedPassword = await bcrypt.hash(password, 12);

		// Create user
		const [newUser] = await db
			.insert(users)
			.values({
				name,
				email,
				password: hashedPassword,
				role: 'user'
			})
			.returning();

		// Generate verification token
		const token = crypto.randomUUID();
		const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

		await db.insert(verificationTokens).values({
			identifier: email,
			token,
			expires
		});

		// Send verification email with domain
		const url = `/auth/verify?token=${token}`;
		const baseUrl = request.headers.get('origin') || 'http://localhost:5173';
		await sendVerificationEmail(email, url, baseUrl);

		return json({
			success: true,
			message: 'User created successfully. Verification email sent.',
			userId: newUser.id
		});
	} catch (error) {
		console.error('Signup error:', error);
		return json({ error: 'Internal server error' }, { status: 500 });
	}
};
