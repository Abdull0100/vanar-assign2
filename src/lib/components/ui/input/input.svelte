<script lang="ts">
	import { cn } from "$lib/utils.js";
	import type { HTMLInputAttributes } from "svelte/elements";

	type $$Props = HTMLInputAttributes & {
		class?: string;
	};

	let className: $$Props["class"] = undefined;
	export { className as class };
	export let value: $$Props["value"] = undefined;

	// We need this to support both controlled and uncontrolled components
	let inputElement: HTMLInputElement;

	$: if (inputElement && value !== undefined) {
		inputElement.value = value as string;
	}
</script>

<input
	bind:this={inputElement}
	class={cn(
		"h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
		className
	)}
	bind:value
	on:blur
	on:change
	on:click
	on:focus
	on:focusin
	on:focusout
	on:keydown
	on:keypress
	on:keyup
	on:mouseover
	on:mouseenter
	on:mouseleave
	on:paste
	on:input
	{...$$restProps}
/>
