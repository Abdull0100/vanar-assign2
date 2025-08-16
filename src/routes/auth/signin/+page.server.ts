import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const session = await locals.getSession?.();

	// If user is already authenticated, redirect to dashboard
	if (session?.user) {
		throw redirect(303, '/dashboard');
	}

	return {
		session
	};
};
