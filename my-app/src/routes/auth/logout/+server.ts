import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ cookies }) => {
	cookies.set('session_id', '', {
		path: '/',
		maxAge: 0
	});

	throw redirect(302, '/login');
};
