export { db } from './server/db';
export * from './server/db/schema';
export * from './auth';

// Simple retry helper for transient DB/API operations
export async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 200): Promise<T> {
  let lastErr: unknown;
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt < retries - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

// Database connection utility
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    const { db } = await import('./server/db');
    const { users } = await import('./server/db/schema');
    // Simple query to check connection
    await db.select().from(users).limit(1);
    return true;
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}