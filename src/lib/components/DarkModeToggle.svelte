<script lang="ts">
	import { darkMode } from '$lib/stores/darkMode';
	import { Button } from '$lib/components/ui/button';
	import { Sun, Moon } from '@lucide/svelte';

	export let size: 'sm' | 'default' | 'lg' = 'default';
	export let variant: 'default' | 'ghost' | 'outline' | 'secondary' = 'ghost';
	export let showLabel: boolean = false;
</script>

<Button
	{variant}
	{size}
	onclick={darkMode.toggle}
	aria-label={$darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
	class="transition-all duration-200"
>
	{#if $darkMode}
		<Sun class="h-4 w-4 {showLabel ? 'mr-2' : ''}" />
		{#if showLabel}
			<span class="hidden sm:inline">Light</span>
		{/if}
	{:else}
		<Moon class="h-4 w-4 {showLabel ? 'mr-2' : ''}" />
		{#if showLabel}
			<span class="hidden sm:inline">Dark</span>
		{/if}
	{/if}
</Button>
