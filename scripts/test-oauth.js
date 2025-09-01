#!/usr/bin/env node

/**
 * OAuth Configuration Test Script
 *
 * This script checks if all required OAuth environment variables are set.
 * Run this script to verify your OAuth setup before testing.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

console.log('🔍 Checking OAuth Configuration...\n');

const requiredVars = {
	AUTH_SECRET: process.env.AUTH_SECRET,
	GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
	GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
	GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET
};

let allSet = true;

console.log('Required Environment Variables:');
console.log('================================');

for (const [varName, value] of Object.entries(requiredVars)) {
	const status = value ? '✅' : '❌';
	const displayValue = value ? `${value.substring(0, 10)}...` : 'NOT SET';

	console.log(`${status} ${varName}: ${displayValue}`);

	if (!value) {
		allSet = false;
	}
}

console.log('\n================================');

if (allSet) {
	console.log('🎉 All OAuth environment variables are configured!');
	console.log('\nNext steps:');
	console.log('1. Start your development server: npm run dev');
	console.log('2. Navigate to /auth/signin or /auth/signup');
	console.log('3. Test the Google and GitHub OAuth buttons');
} else {
	console.log('❌ Some OAuth environment variables are missing!');
	console.log('\nPlease:');
	console.log('1. Follow the OAUTH_SETUP.md guide');
	console.log('2. Set up Google and GitHub OAuth applications');
	console.log('3. Add the required environment variables to your .env file');
	console.log('4. Run this script again to verify the setup');
}

console.log('\nFor detailed setup instructions, see: OAUTH_SETUP.md');
