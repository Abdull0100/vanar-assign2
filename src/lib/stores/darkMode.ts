import { writable } from 'svelte/store';
import { browser } from '$app/environment';

// Create a writable store for dark mode state
function createDarkModeStore() {
	// Initialize with system preference or default to false
	const initialValue = browser ? 
		localStorage.getItem('darkMode') === 'true' || 
		(!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)
		: false;

	const { subscribe, set, update } = writable<boolean>(initialValue);

	return {
		subscribe,
		toggle: () => update(isDark => {
			const newValue = !isDark;
			if (browser) {
				localStorage.setItem('darkMode', String(newValue));
				// Apply or remove dark class to document element
				if (newValue) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
			return newValue;
		}),
		set: (value: boolean) => {
			if (browser) {
				localStorage.setItem('darkMode', String(value));
				// Apply or remove dark class to document element
				if (value) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
			}
			set(value);
		},
		init: () => {
			if (browser) {
				const stored = localStorage.getItem('darkMode');
				const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
				const shouldBeDark = stored === 'true' || (!stored && systemPrefersDark);
				
				if (shouldBeDark) {
					document.documentElement.classList.add('dark');
				} else {
					document.documentElement.classList.remove('dark');
				}
				set(shouldBeDark);

				// Listen for system theme changes
				window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
					if (!localStorage.getItem('darkMode')) {
						if (e.matches) {
							document.documentElement.classList.add('dark');
							set(true);
						} else {
							document.documentElement.classList.remove('dark');
							set(false);
						}
					}
				});
			}
		}
	};
}

export const darkMode = createDarkModeStore();
