import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
	// Load env file based on `mode` in the current working directory.
	const env = loadEnv(mode, process.cwd(), '');
	
	return {
		plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
		define: {
			'process.env.SMTP_USER': JSON.stringify(env.SMTP_USER),
			'process.env.SMTP_HOST': JSON.stringify(env.SMTP_HOST),
			'process.env.SMTP_PORT': JSON.stringify(env.SMTP_PORT),
			'process.env.SMTP_PASS': JSON.stringify(env.SMTP_PASS),
			'process.env.SMTP_FROM': JSON.stringify(env.SMTP_FROM),
			'process.env.SMTP_SECURE': JSON.stringify(env.SMTP_SECURE),
		},
		test: {
			expect: { requireAssertions: true },
			projects: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						environment: 'browser',
						browser: {
							enabled: true,
							provider: 'playwright',
							instances: [{ browser: 'chromium' }]
						},
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts']
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
