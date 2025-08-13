<script lang="ts">
    import LoginForm from "$lib/components/login-form.svelte";
    import BackButton from "$lib/components/back-button.svelte";
</script>

<svelte:head>
    <title>Login</title>
</svelte:head>

<div class="relative flex h-screen w-full items-center justify-center px-4">
    <BackButton href="/" label="Back to homepage" />
    <LoginForm />
</div>
