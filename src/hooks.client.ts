import type { HandleClientError } from '@sveltejs/kit';

// Handle client-side errors
export const handleError: HandleClientError = async ({ error, event }) => {
	// Log the error for debugging
	console.error('Client error:', error);

	// Don't expose sensitive error details
	if (import.meta.env.PROD) {
		return {
			message: 'Something went wrong! Please try refreshing the page.',
			code: 'CLIENT_ERROR'
		};
	}

	// In development, show more details
	return {
		message: error instanceof Error ? error.message : 'An unexpected client error occurred'
	};
};
