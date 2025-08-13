<script lang="ts">
	import SignupForm from "$lib/components/signup-form.svelte";
	import BackButton from "$lib/components/back-button.svelte";
</script>

<svelte:head>
	<title>Sign-up</title>
</svelte:head>	

<div class="relative flex h-screen w-full items-center justify-center px-4">
	<BackButton href="/" label="Back to homepage" />
	<SignupForm />
</div>
