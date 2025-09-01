<script lang="ts">
	import { CheckCircle, AlertCircle, Info } from '@lucide/svelte';
	export let show: boolean = false;
	export let message: string = '';
	export let type: 'success' | 'error' | 'info' = 'success';
</script>

{#if show}
	<div class="fixed top-4 right-4 z-50 transform transition-all duration-300 ease-out">
		<div
			class="max-w-sm rounded-lg border px-4 py-3 shadow-lg {type === 'success'
				? 'border-primary/20 bg-primary/10 text-primary'
				: type === 'error'
					? 'border-destructive/20 bg-destructive/10 text-destructive'
					: 'border-accent/20 bg-accent/10 text-accent-foreground'}"
		>
			<div class="flex items-center space-x-2">
				{#if type === 'success'}
					<CheckCircle class="h-5 w-5 text-primary" />
				{:else if type === 'error'}
					<AlertCircle class="h-5 w-5 text-destructive" />
				{:else}
					<Info class="h-5 w-5 text-accent-foreground" />
				{/if}
				<span class="text-sm font-medium">{message}</span>
			</div>
		</div>
	</div>
{/if}
