import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const token = url.searchParams.get('token');
	const redirectUrl = token ? `/auth/verify?token=${token}` : '/auth/verify';
	throw redirect(302, redirectUrl);
};
