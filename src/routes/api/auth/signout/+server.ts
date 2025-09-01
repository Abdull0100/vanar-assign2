import { json, redirect, type RequestHandler } from '@sveltejs/kit';

// Custom signout endpoint: clear our session cookies and return/redirect
export const POST: RequestHandler = async ({ cookies }) => {
	const names = ['next-auth.session-token', '__Secure-next-auth.session-token'];
	for (const name of names) {
		cookies.delete(name, { path: '/' });
	}
	return json({ success: true });
};

export const GET: RequestHandler = async ({ cookies }) => {
	const names = ['next-auth.session-token', '__Secure-next-auth.session-token'];
	for (const name of names) {
		cookies.delete(name, { path: '/' });
	}
	throw redirect(302, '/');
};
