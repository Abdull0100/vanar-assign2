

<!-- Navbar -->
<nav class="h-16 flex flex-row-reverse space-x-10 space-x-reverse font-medium py-5 pr-8 bg-secondary text-nav-foreground">
	<a class="nav-link" href="/auth/login">Login</a>
	<a class="nav-link" href="/auth/signup">Sign-up</a>
	<a class="nav-link" href="/">Home</a>
</nav>
<!-- Main page content -->
<main class="flex-1">
	<div class="flex flex-col items-center justify-center text-center h-[calc(100vh-4rem)] px-6">
		<h1 class="text-4xl font-bold mb-4">Welcome to ChatBridge</h1>
		<p class="text-lg text-gray-600 max-w-2xl">
    	Your personal AI companion powered by Google's Gemini.  
    	Ask questions, get instant answers, and explore ideas in real-time.  
		<span class="font-semibold"><a class="inline-text-link" href="/auth/signup">Sign up</a></span> to start chatting and unlock the full experience.
  		</p>
	</div>

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

	.inline-text-link {
  		position: relative;
  		color: var(--color-primary);
  		font-weight: 600;
  		transition: color 0.3s ease, transform 0.2s ease;
	}

	.inline-text-link::after {
	  content: "";
	  position: absolute;
	  left: 50%;
	  bottom: -2px;
	  width: 0;
	  height: 2px;
	  background-color: var(--color-primary);
	  transition: width 0.3s ease, left 0.3s ease;
	}

	.inline-text-link:hover {
	  color: var(--color-primary-hover, #7c3aed); /* fallback hover color */
	  transform: scale(1.05);
	}

	.inline-text-link:hover::after {
	  width: 100%;
	  left: 0;
	}

</style>
