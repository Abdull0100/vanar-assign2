<script lang="ts">
	let { children } = $props();
	import '../app.css';
</script>
<div class="h-screen bg-background text-foreground flex flex-col">
	{@render children?.()}
</div>