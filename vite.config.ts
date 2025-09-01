import devtoolsJson from 'vite-plugin-devtools-json';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit(), devtoolsJson()],
	build: {
		target: 'esnext',
		minify: 'terser',
		rollupOptions: {
			output: {
				manualChunks: {
					vendor: ['svelte', '@sveltejs/kit'],
					ui: ['@lucide/svelte', 'bits-ui'],
					drizzle: ['drizzle-orm', 'postgres'],
					auth: ['@auth/core', '@auth/sveltekit']
				}
			}
		}
	},
	optimizeDeps: {
		include: ['@lucide/svelte', 'bits-ui', 'drizzle-orm', 'postgres', '@auth/core'],
		exclude: ['@sveltejs/kit']
	},
	server: {
		fs: {
			allow: ['..']
		}
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
});
