<div class="home-container">
	<h1>Welcome to SvelteKit</h1>
	<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>
	<div class="actions">
		<a href="/login" class="btn">Login</a>
		<a href="/signup" class="btn">Sign Up</a>
	</div>
</div>

<style>
	.home-container {
		max-width: 400px;
		margin: 4rem auto;
		padding: 2rem;
		border: 1px solid #ddd;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
		text-align: center;
	}
	.actions {
		margin-top: 2rem;
		display: flex;
		justify-content: center;
		gap: 1rem;
	}
	.btn {
		display: inline-block;
		padding: 0.75rem 1.5rem;
		background-color: #007bff;
		color: white;
		text-decoration: none;
		border-radius: 4px;
		font-weight: 500;
		transition: background-color 0.2s;
	}
	.btn:hover {
		background-color: #0056b3;
	}
</style>
