import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals, url }) => {
	try {
		const session = await locals.getSession?.();

		return {
			session,
			url: url.pathname
		};
	} catch (error) {
		// Log error but don't crash the entire app
		console.error('Layout load error:', error);

		return {
			session: null,
			url: url.pathname
		};
	}
};
