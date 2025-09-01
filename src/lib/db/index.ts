import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { DATABASE_URL } from '$env/static/private';

const connectionString = DATABASE_URL || 'postgresql://postgres:123@localhost:5433/local';

// Configure connection pooling for better performance
const client = postgres(connectionString, {
	max: 10, // Reduced max connections for faster startup
	idle_timeout: 10, // Close idle connections faster
	max_lifetime: 60 * 10, // Shorter connection lifetime
	prepare: false, // Disable prepared statements for better performance
	transform: {
		undefined: null
	},
	// Add connection timeout for faster failure detection
	connect_timeout: 5
});

export const db = drizzle(client, { schema });

export * from './schema';
