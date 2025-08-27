import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const errorType = url.searchParams.get('type') || '500';
	
	switch (errorType) {
		case '404':
			throw error(404, 'This is a test 404 error page');
		case '403':
			throw error(403, 'This is a test 403 forbidden error');
		case '500':
		default:
			throw error(500, 'This is a test 500 server error');
	}
};
