import { writable } from 'svelte/store';
import { browser } from '$app/environment';

function createDarkModeStore() {
	// Read the initial value from the <html> element's classList.
	const initialValue = browser ? document.documentElement.classList.contains('dark') : false;

	const { subscribe, set } = writable<boolean>(initialValue);

	return {
		subscribe,
		toggle: () => {
			if (browser) {
				// 1. Toggle the class on the <html> element.
				const isDark = document.documentElement.classList.toggle('dark');

				// 2. Save the user's preference to localStorage.
				localStorage.setItem('darkMode', String(isDark));

				// 3. Update the Svelte store's value.
				set(isDark);
			}
		}
	};
}

export const darkMode = createDarkModeStore();
