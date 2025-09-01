import { error } from '@sveltejs/kit';

// Custom error classes for better error handling
export class AppError extends Error {
	constructor(
		message: string,
		public status: number = 500,
		public code?: string
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class AuthError extends AppError {
	constructor(message: string = 'Authentication required') {
		super(message, 401, 'AUTH_ERROR');
	}
}

export class ForbiddenError extends AppError {
	constructor(message: string = 'Access forbidden') {
		super(message, 403, 'FORBIDDEN_ERROR');
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Resource not found') {
		super(message, 404, 'NOT_FOUND_ERROR');
	}
}

export class ValidationError extends AppError {
	constructor(message: string = 'Validation failed') {
		super(message, 400, 'VALIDATION_ERROR');
	}
}

// Helper function to throw SvelteKit errors
export function throwError(status: number, message: string, code?: string): never {
	throw error(status, message);
}

// Helper to handle API errors gracefully
export function handleApiError(err: unknown): never {
	if (err instanceof AppError) {
		throw error(err.status, err.message);
	}

	if (err instanceof Error) {
		console.error('API Error:', err);
		throw error(500, 'Internal server error');
	}

	throw error(500, 'An unexpected error occurred');
}
