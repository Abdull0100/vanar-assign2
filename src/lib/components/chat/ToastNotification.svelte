<script lang="ts">
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
					<svg class="h-5 w-5 text-primary" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else if type === 'error'}
					<svg class="h-5 w-5 text-destructive" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
							clip-rule="evenodd"
						/>
					</svg>
				{:else}
					<svg class="h-5 w-5 text-accent-foreground" fill="currentColor" viewBox="0 0 20 20">
						<path
							fill-rule="evenodd"
							d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
							clip-rule="evenodd"
						/>
					</svg>
				{/if}
				<span class="text-sm font-medium">{message}</span>
			</div>
		</div>
	</div>
{/if}
