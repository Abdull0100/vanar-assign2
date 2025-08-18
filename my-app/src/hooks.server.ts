import type { Handle } from '@sveltejs/kit';

// helper to detect redirect objects
function isRedirect(e: unknown): e is { status: number; location: string } {
	return !!e && typeof e === 'object' && 'status' in e && 'location' in e;
}

export const handle: Handle = async ({ event, resolve }) => {
	try {
		// Temporarily disable database authentication for AI Chat testing
		(event.locals as any).user = null;
		
		return await resolve(event);
	} catch (e) {
		// 👇 ignore redirects so they don't get logged as errors
		if (isRedirect(e)) throw e;

		console.error('Unhandled error in hooks.server.ts:', e);
		throw e;
	}
};
