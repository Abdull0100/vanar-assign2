<script lang="ts">
	export let label: string = 'Loading data...';
</script>

<div class="text-center py-8 font-sans">
	<!-- Spinner -->
	<div
		class="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"
	></div>

	<!-- Label -->
	<p class="mt-2 text-muted-foreground">{label}</p>
</div>
