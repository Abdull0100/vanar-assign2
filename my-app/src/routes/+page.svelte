<script lang="ts">
	let { data } = $props<{ data: { user: any } }>();
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 relative overflow-hidden">
	<!-- Animated Background Elements -->
	<div class="absolute inset-0 overflow-hidden pointer-events-none">
		<!-- Floating Particles -->
		<div class="absolute top-20 left-10 w-4 h-4 bg-blue-400 rounded-full animate-float opacity-60"></div>
		<div class="absolute top-40 right-20 w-6 h-6 bg-purple-400 rounded-full animate-float-delayed opacity-60"></div>
		<div class="absolute bottom-40 left-20 w-3 h-3 bg-pink-400 rounded-full animate-float-slow opacity-60"></div>
		<div class="absolute top-60 left-1/4 w-5 h-5 bg-indigo-400 rounded-full animate-float opacity-60"></div>
		<div class="absolute bottom-60 right-1/3 w-4 h-4 bg-cyan-400 rounded-full animate-float-delayed opacity-60"></div>
		
		<!-- Animated Shapes -->
		<div class="absolute top-32 right-1/4 w-16 h-16 border-2 border-blue-300 rounded-full animate-spin-slow opacity-30"></div>
		<div class="absolute bottom-32 left-1/3 w-12 h-12 border-2 border-purple-300 rounded-lg animate-pulse opacity-30"></div>
		<div class="absolute top-1/2 left-10 w-8 h-8 border-2 border-pink-300 rotate-45 animate-bounce-slow opacity-30"></div>
	</div>
	<!-- Hero Section -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
		<div class="text-center">
			<!-- Animated App Logo/Icon -->
			<div class="mb-8">
				<div class="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg mb-6 animate-bounce">
					<span class="text-4xl animate-pulse">🚀</span>
				</div>
			</div>
			
			<!-- Main Heading -->
			<h1 class="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
				Welcome to <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">MyApp</span>
			</h1>
			
			<!-- Tagline -->
			<p class="text-xl md:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto leading-relaxed">
				Your modern authentication platform with OAuth, role-based access, and secure sessions
			</p>
			
			<!-- Welcome Message for Logged-in Users -->
			{#if data.user}
				<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 mb-12 animate-fade-in">
					<div class="flex items-center justify-center space-x-3 mb-4">
						<div class="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center animate-pulse">
							<span class="text-white font-semibold text-lg">
								{data.user.name ? data.user.name.charAt(0).toUpperCase() : 'U'}
							</span>
						</div>
						<div class="text-left">
							<h2 class="text-2xl font-bold text-gray-900 animate-slide-in-left">Welcome back, {data.user.name || 'User'}! 👋</h2>
							<p class="text-gray-600 animate-slide-in-left-delay">You're logged in as a <span class="font-semibold {data.user.role === 'admin' ? 'text-red-600' : 'text-blue-600'}">{data.user.role}</span></p>
						</div>
					</div>
				</div>
			{/if}
			
			<!-- Action Buttons -->
			<div class="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in-up">
				{#if !data.user}
					<!-- Not logged in - Show Login/Signup -->
					<a 
						href="/login" 
						class="group relative px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
					>
						<span>🔐</span>
						<span>Sign In</span>
						<svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
						</svg>
					</a>
					
					<a 
						href="/signup" 
						class="group relative px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
					>
						<span>✨</span>
						<span>Create Account</span>
						<svg class="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
						</svg>
					</a>
				{:else}
					<!-- Logged in - Show App Actions -->
					<a 
						href="/dashboard" 
						class="group relative px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
					>
						<span>📊</span>
						<span>Dashboard</span>
					</a>
					
					<a 
						href="/profile" 
						class="group relative px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
					>
						<span>👤</span>
						<span>Profile</span>
					</a>
					
					{#if data.user.role === 'admin'}
						<a 
							href="/admin" 
							class="group relative px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
						>
							<span>🔐</span>
							<span>Admin Panel</span>
						</a>
					{/if}
					
					<a 
						href="/auth/logout" 
						class="group relative px-6 py-3 bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center space-x-2"
					>
						<span>🚪</span>
						<span>Logout</span>
					</a>
				{/if}
			</div>
		</div>
	</div>
	
	<!-- Feature Highlights -->
	<div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
		<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
			<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center hover:scale-105 transition-transform duration-300 animate-fade-in-up" style="animation-delay: 0.1s;">
				<div class="text-4xl mb-4 animate-bounce">🔐</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Secure Authentication</h3>
				<p class="text-gray-600">OAuth with Google & GitHub, plus traditional email/password login</p>
			</div>
			
			<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center hover:scale-105 transition-transform duration-300 animate-fade-in-up" style="animation-delay: 0.2s;">
				<div class="text-4xl mb-4 animate-bounce" style="animation-delay: 0.5s;">👥</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Role-Based Access</h3>
				<p class="text-gray-600">Admin and user roles with protected routes and permissions</p>
			</div>
			
			<div class="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20 text-center hover:scale-105 transition-transform duration-300 animate-fade-in-up" style="animation-delay: 0.3s;">
				<div class="text-4xl mb-4 animate-bounce" style="animation-delay: 1s;">⚡</div>
				<h3 class="text-xl font-bold text-gray-900 mb-3">Modern Stack</h3>
				<p class="text-gray-600">Built with SvelteKit, PostgreSQL, and TailwindCSS</p>
			</div>
		</div>
	</div>
</div>

<style>
	/* Custom Animations */
	@keyframes float {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-20px) rotate(180deg); }
	}
	
	@keyframes float-delayed {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-15px) rotate(-180deg); }
	}
	
	@keyframes float-slow {
		0%, 100% { transform: translateY(0px) rotate(0deg); }
		50% { transform: translateY(-10px) rotate(90deg); }
	}
	
	@keyframes spin-slow {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	
	@keyframes bounce-slow {
		0%, 100% { transform: translateY(0px) rotate(45deg); }
		50% { transform: translateY(-10px) rotate(45deg); }
	}
	
	@keyframes fade-in {
		from { opacity: 0; transform: translateY(20px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	@keyframes fade-in-up {
		from { opacity: 0; transform: translateY(30px); }
		to { opacity: 1; transform: translateY(0); }
	}
	
	@keyframes slide-in-left {
		from { opacity: 0; transform: translateX(-30px); }
		to { opacity: 1; transform: translateX(0); }
	}
	
	@keyframes slide-in-left-delay {
		from { opacity: 0; transform: translateX(-30px); }
		to { opacity: 1; transform: translateX(0); }
	}
	
	.animate-float {
		animation: float 6s ease-in-out infinite;
	}
	
	.animate-float-delayed {
		animation: float-delayed 8s ease-in-out infinite;
	}
	
	.animate-float-slow {
		animation: float-slow 10s ease-in-out infinite;
	}
	
	.animate-spin-slow {
		animation: spin-slow 20s linear infinite;
	}
	
	.animate-bounce-slow {
		animation: bounce-slow 4s ease-in-out infinite;
	}
	
	.animate-fade-in {
		animation: fade-in 1s ease-out;
	}
	
	.animate-fade-in-up {
		animation: fade-in-up 1s ease-out;
	}
	
	.animate-slide-in-left {
		animation: slide-in-left 0.8s ease-out;
	}
	
	.animate-slide-in-left-delay {
		animation: slide-in-left 0.8s ease-out 0.2s both;
	}
	
	/* Hover Effects */
	.hover\:scale-105:hover {
		transform: scale(1.05);
	}
	
	/* Smooth transitions */
	* {
		transition: all 0.3s ease;
	}
</style>
