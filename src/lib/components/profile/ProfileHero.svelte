<script lang="ts">
	export let user: { role?: string } | null = null;
</script>

<section class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-400 via-violet-400 to-pink-400 px-8 py-12 text-white shadow-2xl mb-8" role="banner" aria-labelledby="profile-settings-title">
	<div class="absolute inset-0 bg-black/10"></div>
	<div class="relative z-10">
		<div class="flex items-center justify-between">
			<div>
				<h1 id="profile-settings-title" class="text-4xl font-bold mb-2">Profile Settings</h1>
				<p class="text-xl text-indigo-100">Manage your account and preferences</p>
				<div class="mt-4 inline-flex items-center rounded-full bg-white/20 backdrop-blur-sm px-4 py-2" role="status" aria-live="polite">
					<div class="h-2 w-2 rounded-full bg-indigo-300 mr-2" aria-hidden="true"></div>
					<span class="text-sm font-medium">{user?.role === 'admin' ? '👑 Administrator Account' : '👤 User Account'}</span>
				</div>
			</div>
			<div class="hidden md:block">
				<div class="h-32 w-32 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center" aria-hidden="true">
					<span class="text-5xl">⚙️</span>
				</div>
			</div>
		</div>
	</div>
</section>


