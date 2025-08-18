import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '$env/dynamic/private';

let db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
	if (!db) {
		if (!env.DATABASE_URL) {
			throw new Error('DATABASE_URL is not set');
		}
		const client = postgres(env.DATABASE_URL);
		db = drizzle(client, { schema });
	}
	return db;
}

// For backward compatibility - export as a getter
export const dbClient = {
	get select() {
		return getDb().select;
	},
	get insert() {
		return getDb().insert;
	},
	get update() {
		return getDb().update;
	},
	get delete() {
		return getDb().delete;
	},
	get query() {
		return getDb().query;
	}
};
