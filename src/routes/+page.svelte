<script lang="ts">
  import { page } from '$app/stores';
  import { redirect } from '@sveltejs/kit';

  export const load = async ({ locals }: { locals: { auth?: () => Promise<{ user: any } | null> } }) => {
    const session = await locals.auth?.();
    if (session?.user) throw redirect(303, '/dashboard');
    return {};
  };
</script>

<svelte:head>
  <title>Home - ChatBridge</title>
</svelte:head>

<!-- Navbar -->
<nav class="h-16 flex flex-row-reverse space-x-10 space-x-reverse font-medium py-5 pr-8 bg-secondary text-nav-foreground">
  <a class="nav-link" href="/auth/login">Login</a>
  <a class="nav-link" href="/auth/signup">Sign-up</a>
  <a class="nav-link" href="/">Home</a>
</nav>

<!-- Main page content -->
<main class="flex-1 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
  <div class="container mx-auto px-6 py-20">
    <!-- Hero Section -->
    <div class="max-w-4xl mx-auto text-center">
      <h1 class="text-5xl md:text-6xl font-bold mb-6 text-primary bg-clip-text bg-gradient-to-r from-teal-400 to-blue-500">
        Welcome to <span class="text-white">ChatBridge</span>
      </h1>
      
      <p class="text-xl md:text-2xl text-gray-300 mb-10 max-w-3xl mx-auto">
        Your personal AI companion powered by Google's Gemini with enterprise-grade security and beautiful UI
      </p>
      
      <div class="flex justify-center gap-4 mb-16">
        <a href="/auth/signup" class="hero-btn bg-primary text-primary-foreground hover:bg-primary/90">
          Get Started
        </a>
        <a href="/auth/login" class="hero-btn bg-transparent border border-white/20 text-white hover:bg-white/10">
          Sign In
        </a>
      </div>
    </div>
    
    <!-- Features Grid -->
    <div class="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mt-20">
      <div class="feature-card">
        <div class="feature-icon bg-teal-500/10">
          <svg class="w-8 h-8 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold mb-3">AI-Powered Chat</h3>
        <p class="text-gray-400">Ask questions, get instant answers, and explore ideas with Google's advanced Gemini AI technology.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon bg-blue-500/10">
          <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold mb-3">Secure Authentication</h3>
        <p class="text-gray-400">Enterprise-grade security with Auth.js, database sessions, and role-based access control.</p>
      </div>
      
      <div class="feature-card">
        <div class="feature-icon bg-purple-500/10">
          <svg class="w-8 h-8 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h3 class="text-2xl font-bold mb-3">Lightning Fast</h3>
        <p class="text-gray-400">Built with SvelteKit and TailwindCSS for instant page loads and seamless user experience.</p>
      </div>
    </div>
    
    <!-- Stats -->
    <div class="max-w-4xl mx-auto mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
      <div class="stat-card">
        <div class="text-4xl font-bold text-teal-400 mb-2">AI</div>
        <div class="text-gray-400">Powered</div>
      </div>
      <div class="stat-card">
        <div class="text-4xl font-bold text-blue-400 mb-2">Auth.js</div>
        <div class="text-gray-400">Security</div>
      </div>
      <div class="stat-card">
        <div class="text-4xl font-bold text-purple-400 mb-2">Real-time</div>
        <div class="text-gray-400">Responses</div>
      </div>
      <div class="stat-card">
        <div class="text-4xl font-bold text-pink-400 mb-2">24/7</div>
        <div class="text-gray-400">Available</div>
      </div>
    </div>

    <!-- Call to Action -->
    <div class="max-w-2xl mx-auto text-center mt-20">
      <h2 class="text-3xl font-bold mb-4">Ready to start chatting?</h2>
      <p class="text-gray-300 mb-6">
        <span class="font-semibold">
          <a class="inline-text-link" href="/auth/signup">Sign up</a>
        </span> 
        to start chatting and unlock the full ChatBridge experience with your personal AI assistant.
      </p>
    </div>
  </div>
</main>

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
    color: var(--color-primary-hover, #7c3aed);
    transform: scale(1.05);
  }

  .inline-text-link:hover::after {
    width: 100%;
    left: 0;
  }

  .hero-btn {
    padding: 0.75rem 2rem;
    font-size: 1.125rem;
    font-weight: 600;
    border-radius: 9999px;
    transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
    display: inline-flex;
    align-items: center;
  }

  .hero-btn:hover {
    transform: translateY(-0.25rem) scale(1.05);
  }

  .feature-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    padding: 2rem;
    border-radius: 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 300ms ease;
  }

  .feature-card:hover {
    border-color: rgba(20, 184, 166, 0.3);
    transform: translateY(-0.25rem);
  }

  .feature-icon {
    width: 4rem;
    height: 4rem;
    border-radius: 0.75rem;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
  }

  .stat-card {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    padding: 1.5rem;
    border-radius: 0.75rem;
    transition: all 300ms ease;
  }

  .stat-card:hover {
    transform: translateY(-0.25rem);
  }
</style>