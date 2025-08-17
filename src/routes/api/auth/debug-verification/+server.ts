import { json, type RequestHandler } from '@sveltejs/kit';
import { db } from '$lib/db';
import { verificationTokens } from '$lib/db/schema';

export const GET: RequestHandler = async () => {
	try {
		// Get all verification tokens
		const allTokens = await db.select().from(verificationTokens);
		
		console.log('All verification tokens in database:', allTokens);
		
		return json({ 
			tokens: allTokens,
			count: allTokens.length,
			tableName: 'verificationTokens'
		});
	} catch (error) {
		console.error('Debug verification error:', error);
		return json({ error: 'Failed to query verification tokens' }, { status: 500 });
	}
};
