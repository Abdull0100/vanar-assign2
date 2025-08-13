

<!-- Navbar -->
<nav class="h-16 flex flex-row-reverse space-x-10 space-x-reverse font-medium py-5 pr-8 bg-secondary text-nav-foreground">
	<a class="nav-link" href="/auth/login">Login</a>
	<a class="nav-link" href="/auth/signup">Sign-up</a>
	<a class="nav-link" href="/">Home</a>
</nav>
<!-- Main page content -->
<main class="flex-1">
</main>
<!-- 
<footer class="h-16 flex items-center justify-center bg-card text-nav-foreground font-medium">
	<p>© {new Date().getFullYear()} Assignment 2</p>
</footer>
-->

<style>
	.nav-link {
		transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
		height: 2rem;
		padding: 0.25rem 0.75rem;
		border-radius: 0.375rem;
		display: flex;
		align-items: center;
	}

	.nav-link:hover {
		color: white;
		background-color: var(--color-primary);
		transform: translateY(-0.25rem) scale(1.05);
	}
</style>
