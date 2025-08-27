// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { DefaultSession, Session } from '@auth/core/types';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			getSession?: () => Promise<Session | null>;
			request?: Request;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

declare module '@auth/core/types' {
	interface Session extends DefaultSession {
		user?: {
			id: string;
			role: string;
			emailVerified?: Date | null;
			password?: string | null;
		} & DefaultSession['user'];
	}
}

export {};
