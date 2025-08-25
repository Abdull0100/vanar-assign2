<script lang="ts">
	import type { DefaultSession } from '@auth/core/types';

	export let user:
		| ({ id: string; role: string; emailVerified?: Date | null; password?: string | null } &
				DefaultSession['user'])
		| undefined;
</script>

<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-300 via-violet-300 to-pink-200 px-8 py-12 text-gray-900 shadow-md border border-indigo-100 animate-fade-in">
	<div class="absolute inset-0 bg-black/10"></div>
	<!-- Animated background patterns -->
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
	<div class="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(255,255,255,0.1)_0%,transparent_50%)]"></div>
	<!-- Floating elements -->
	<div class="absolute top-4 right-4 w-16 h-16 bg-white/10 rounded-full animate-pulse"></div>
	<div class="absolute bottom-4 left-4 w-12 h-12 bg-white/10 rounded-full animate-pulse" style="animation-delay: 1s"></div>
	<div class="absolute top-1/2 left-4 w-8 h-8 bg-white/10 rounded-full animate-bounce" style="animation-delay: 0.5s"></div>
	<div class="relative z-10">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold mb-2 animate-fade-in-up">Welcome back, {user?.name || 'User'}!</h1>
				<p class="text-xl text-gray-700 animate-fade-in-up" style="animation-delay: 0.2s">You're signed in as {user?.email}</p>
				<div class="mt-4 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2 animate-bounce" style="animation-delay: 1s">
					<div class="h-2 w-2 rounded-full bg-green-400 mr-2 animate-pulse"></div>
					<span class="text-sm font-medium">
						{user?.role === 'admin' ? 'Administrator' : 'User'}
					</span>
				</div>
			</div>
			<div class="hidden md:block">
				<div class="h-32 w-32 rounded-full bg-gradient-to-br from-white/30 to-white/10 backdrop-blur-md flex items-center justify-center animate-float relative shadow-2xl border border-white/20">
					<!-- Multiple glowing layers -->
					<div class="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 opacity-30 animate-pulse blur-sm"></div>
					<div class="absolute inset-2 rounded-full bg-gradient-to-r from-blue-400 via-purple-400 to-rose-400 opacity-40 animate-pulse blur-md"></div>
					<div class="absolute inset-4 rounded-full bg-gradient-to-r from-indigo-300 via-violet-300 to-pink-300 opacity-50 animate-pulse blur-lg"></div>
					
					<!-- Enhanced lightning bolt with gradient -->
					<div class="relative z-20">
						<svg class="w-16 h-16 animate-pulse relative z-10 drop-shadow-2xl" fill="none" viewBox="0 0 24 24">
							<defs>
								<linearGradient id="lightningGradient" x1="0%" y1="0%" x2="100%" y2="100%">
									<stop offset="0%" style="stop-color:#ffffff;stop-opacity:1" />
									<stop offset="50%" style="stop-color:#fbbf24;stop-opacity:1" />
									<stop offset="100%" style="stop-color:#f59e0b;stop-opacity:1" />
								</linearGradient>
								<filter id="glow">
									<feGaussianBlur stdDeviation="3" result="coloredBlur"/>
									<feMerge> 
										<feMergeNode in="coloredBlur"/>
										<feMergeNode in="SourceGraphic"/>
									</feMerge>
								</filter>
							</defs>
							<path stroke="url(#lightningGradient)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" filter="url(#glow)" />
						</svg>
					</div>
					
					<!-- Enhanced orbiting particles -->
					<div class="absolute top-0 left-1/2 w-3 h-3 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-full animate-orbit shadow-lg"></div>
					<div class="absolute bottom-0 left-1/2 w-2 h-2 bg-gradient-to-r from-pink-300 to-rose-400 rounded-full animate-orbit shadow-lg" style="animation-delay: 0.5s"></div>
					<div class="absolute left-0 top-1/2 w-2 h-2 bg-gradient-to-r from-blue-300 to-indigo-400 rounded-full animate-orbit-reverse shadow-lg" style="animation-delay: 1s"></div>
					<div class="absolute right-0 top-1/2 w-1.5 h-1.5 bg-gradient-to-r from-violet-300 to-purple-400 rounded-full animate-orbit-reverse shadow-lg" style="animation-delay: 1.5s"></div>
					
					<!-- Sparkle effects -->
					<div class="absolute top-2 right-2 w-1 h-1 bg-yellow-300 rounded-full animate-sparkle"></div>
					<div class="absolute bottom-2 left-2 w-1 h-1 bg-pink-300 rounded-full animate-sparkle" style="animation-delay: 0.3s"></div>
					<div class="absolute top-1/2 left-2 w-1 h-1 bg-blue-300 rounded-full animate-sparkle" style="animation-delay: 0.6s"></div>
					<div class="absolute top-1/2 right-2 w-1 h-1 bg-violet-300 rounded-full animate-sparkle" style="animation-delay: 0.9s"></div>
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	@keyframes fade-in {
		from {
			opacity: 0;
			transform: translateY(30px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes fade-in-up {
		from {
			opacity: 0;
			transform: translateY(20px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@keyframes float {
		0%, 100% {
			transform: translateY(0px);
		}
		50% {
			transform: translateY(-8px);
		}
	}

	@keyframes orbit {
		0% {
			transform: rotate(0deg) translateX(20px) rotate(0deg);
		}
		100% {
			transform: rotate(360deg) translateX(20px) rotate(-360deg);
		}
	}

	@keyframes orbit-reverse {
		0% {
			transform: rotate(0deg) translateX(15px) rotate(0deg);
		}
		100% {
			transform: rotate(-360deg) translateX(15px) rotate(360deg);
		}
	}

	@keyframes sparkle {
		0%, 100% {
			opacity: 0;
			transform: scale(0) rotate(0deg);
		}
		50% {
			opacity: 1;
			transform: scale(1) rotate(180deg);
		}
	}

	.animate-fade-in {
		animation: fade-in 1s ease-out forwards;
	}

	.animate-fade-in-up {
		animation: fade-in-up 0.8s ease-out forwards;
	}

	.animate-float {
		animation: float 4s ease-in-out infinite;
	}

	.animate-orbit {
		animation: orbit 3s linear infinite;
	}

	.animate-orbit-reverse {
		animation: orbit-reverse 4s linear infinite;
	}

	.animate-sparkle {
		animation: sparkle 2s ease-in-out infinite;
	}
</style>
