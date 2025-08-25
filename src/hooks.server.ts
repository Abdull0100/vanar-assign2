import { handle as authHandle } from './lib/auth';
import { redirect, type Handle, type HandleServerError } from '@sveltejs/kit';

// Protected routes that require authentication
const protectedRoutes = ['/dashboard', '/admin', '/profile', '/chat'];

// Admin-only routes
const adminRoutes = ['/admin'];

export const handle: Handle = async ({ event, resolve }) => {
	// Skip Auth.js for __data.json requests to prevent routing conflicts
	if (event.url.pathname.includes('__data.json')) {
		return resolve(event);
	}

	// Use Auth.js for API auth routes
	if (event.url.pathname.startsWith('/api/auth/')) {
		if (event.url.pathname === '/api/auth/signout') {
			return resolve(event);
		}
		return authHandle({ event, resolve });
	}

	// Manual session handling for protected routes
	const sessionCookie = event.cookies.get('next-auth.session-token');
	let session = null;

	if (sessionCookie) {
		// Validate session against database
		try {
			const { db } = await import('./lib/db');
			const { sessions, users } = await import('./lib/db/schema');
			const { eq } = await import('drizzle-orm');

			const sessionData = await db
				.select({
					userId: sessions.userId,
					expires: sessions.expires,
					user: {
						id: users.id,
						email: users.email,
						name: users.name,
						role: users.role,
						image: users.image,
						emailVerified: users.emailVerified,
						password: users.password
					}
				})
				.from(sessions)
				.leftJoin(users, eq(sessions.userId, users.id))
				.where(eq(sessions.sessionToken, sessionCookie))
				.limit(1);

			if (sessionData.length > 0 && sessionData[0].expires > new Date()) {
				session = {
					user: sessionData[0].user,
					expires: sessionData[0].expires.toISOString()
				};
			}
		} catch (error) {
			console.error('Session validation error:', error);
			session = null;
		}
	}

	// Check if user is trying to access protected routes
	const pathname = event.url.pathname;

	if (protectedRoutes.some((route) => pathname.startsWith(route))) {
		if (!session?.user) {
			// Redirect to sign-in if not authenticated
			throw redirect(303, '/auth/signin');
		}

		// Check admin routes
		if (adminRoutes.some((route) => pathname.startsWith(route))) {
			if (session.user.role !== 'admin') {
				// Redirect to dashboard if not admin
				throw redirect(303, '/dashboard');
			}
		}
	}

	// Set session in locals for pages to use
	event.locals.getSession = async () => session as any;

	// Continue with the request
	return resolve(event);
};

// Handle server errors
export const handleError: HandleServerError = async ({ error, event }) => {
	// Log the error for debugging
	console.error('Server error:', error);
	
	// Don't expose sensitive error details in production
	if (import.meta.env.PROD) {
		return {
			message: 'Something went wrong! Our developers are working on it.',
			code: 'INTERNAL_ERROR'
		};
	}
	
	// In development, show more details
	return {
		message: (error as Error)?.message || 'An unexpected error occurred',
		code: (error as any)?.code || 'UNKNOWN_ERROR'
	};
};
