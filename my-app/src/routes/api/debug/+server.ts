import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const GET: RequestHandler = async () => {
	try {
		const envPath = join(process.cwd(), '.env');
		const envExists = existsSync(envPath);
		
		let envContent = '';
		if (envExists) {
			try {
				envContent = readFileSync(envPath, 'utf-8');
			} catch (error) {
				envContent = `Error reading .env file: ${error}`;
			}
		}

		const debugInfo = {
			cwd: process.cwd(),
			envPath,
			envExists,
			envContent: envContent.split('\n').map(line => line.trim()).filter(line => line && !line.startsWith('#')),
			processEnv: {
				hasApiKey: !!process.env.API_KEY,
				apiKeyLength: process.env.API_KEY?.length || 0,
				apiKeyPreview: process.env.API_KEY ? `${process.env.API_KEY.substring(0, 10)}...` : 'not set',
				allEnvKeys: Object.keys(process.env).filter(key => key.includes('API'))
			}
		};

		return json(debugInfo);
	} catch (error) {
		return json({ error: error.message }, { status: 500 });
	}
};
