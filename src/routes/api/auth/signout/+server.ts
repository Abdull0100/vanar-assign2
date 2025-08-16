import { json, redirect, type RequestHandler } from '@sveltejs/kit';

export const POST: RequestHandler = async ({ cookies }) => {
	// Clear the session cookie
	cookies.delete('next-auth.session-token', { path: '/' });
	
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	// Clear the session cookie
	cookies.delete('next-auth.session-token', { path: '/' });
	
	// Redirect to home page
	throw redirect(302, '/');
};
