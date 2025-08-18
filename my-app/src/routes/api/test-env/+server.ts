import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
	try {
		// Try to load environment variables using different methods
		const envCheck = {
			processEnv: {
				hasApiKey: !!process.env.GOOGLE_GENERATIVE_AI_API_KEY,
				apiKeyLength: process.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
				apiKeyPreview: process.env.GOOGLE_GENERATIVE_AI_API_KEY ? `${process.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10)}...` : 'not set'
			},
			importMetaEnv: {
				hasApiKey: !!import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY,
				apiKeyLength: import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY?.length || 0,
				apiKeyPreview: import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY ? `${import.meta.env.GOOGLE_GENERATIVE_AI_API_KEY.substring(0, 10)}...` : 'not set'
			},
			allProcessEnv: Object.keys(process.env).filter(key => key.includes('API')),
			allImportMetaEnv: Object.keys(import.meta.env).filter(key => key.includes('API'))
		};

		return json(envCheck);
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
};
