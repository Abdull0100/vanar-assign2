<script lang="ts">
	import type { DefaultSession } from '@auth/core/types';

	export let user:
		| ({ id: string; role: string; emailVerified?: Date | null; password?: string | null } &
				DefaultSession['user'])
		| undefined;
</script>

<div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-300 via-violet-300 to-pink-200 px-8 py-12 text-gray-900 shadow-md border border-indigo-100">
	<div class="absolute inset-0 bg-black/20"></div>
	<div class="relative z-10">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-4xl font-bold mb-2">Welcome back, {user?.name || 'User'}!</h1>
				<p class="text-xl text-gray-700">You're signed in as {user?.email}</p>
				<div class="mt-4 inline-flex items-center rounded-full bg-indigo-100 px-4 py-2">
					<div class="h-2 w-2 rounded-full bg-green-400 mr-2"></div>
					<span class="text-sm font-medium">
						{user?.role === 'admin' ? '👑 Administrator' : '👤 User'}
					</span>
				</div>
			</div>
			<div class="hidden md:block">
				<div class="h-32 w-32 rounded-full bg-indigo-100 flex items-center justify-center">
					<span class="text-5xl">🚀</span>
				</div>
			</div>
		</div>
	</div>
</div>


