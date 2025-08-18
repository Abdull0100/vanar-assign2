import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const reset = url.searchParams.get('reset') === 'success';

	return {
		user: locals.user,
		reset
	};
};
