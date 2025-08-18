<script lang="ts">
	let { data } = $props<{ data: any }>();

	async function resendVerification() {
		try {
			const response = await fetch('/auth/resend-verification', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: data.userId ? 'user-email' : '' })
			});
			
			const result = await response.json();
			
			if (result.success) {
				alert('Verification email sent! Please check your inbox.');
			} else {
				alert(result.error || 'Failed to send verification email.');
			}
		} catch (error) {
			alert('An error occurred. Please try again.');
		}
	}
</script>

<div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		<div class="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
			
			{#if data.status === 'expired'}
				<!-- Expired Token -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-orange-600 rounded-full shadow-lg mb-6">
						<span class="text-3xl">⏰</span>
					</div>
					<h1 class="text-3xl font-bold text-gray-900 mb-4">Link Expired</h1>
					<p class="text-gray-600 mb-8">
						Your verification link has expired. Please request a new verification email.
					</p>
					
					<div class="space-y-4">
						<a 
							href="/login" 
							class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
						>
							<span>🔐</span>
							<span>Go to Login</span>
						</a>
						
						<button 
							on:click={resendVerification}
							class="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
						>
							<span>📧</span>
							<span>Resend Verification Email</span>
						</button>
					</div>
				</div>

			{:else if data.status === 'invalid'}
				<!-- Invalid Token -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg mb-6">
						<span class="text-3xl">❌</span>
					</div>
					<h1 class="text-3xl font-bold text-gray-900 mb-4">Invalid Link</h1>
					<p class="text-gray-600 mb-8">
						The verification link is invalid or has already been used. Please check your email for the correct link.
					</p>
					
					<div class="space-y-4">
						<a 
							href="/login" 
							class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
						>
							<span>🔐</span>
							<span>Go to Login</span>
						</a>
						
						<a 
							href="/" 
							class="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
						>
							<span>🏠</span>
							<span>Back to Home</span>
						</a>
					</div>
				</div>

			{:else if data.status === 'already_verified'}
				<!-- Already Verified -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-full shadow-lg mb-6">
						<span class="text-3xl">✅</span>
					</div>
					<h1 class="text-3xl font-bold text-gray-900 mb-4">Already Verified</h1>
					<p class="text-gray-600 mb-4">
						Your email address is already verified. You can now log in to your account.
					</p>
					
					{#if data.user}
						<div class="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
							<p class="text-green-800 text-sm">
								<strong>{data.user.name}</strong><br>
								{data.user.email}
							</p>
						</div>
					{/if}
					
					<a 
						href="/login" 
						class="w-full bg-gradient-to-r from-green-600 to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
					>
						<span>🔐</span>
						<span>Login Now</span>
					</a>
				</div>

			{:else if data.status === 'error'}
				<!-- Error -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-red-500 to-red-600 rounded-full shadow-lg mb-6">
						<span class="text-3xl">⚠️</span>
					</div>
					<h1 class="text-3xl font-bold text-gray-900 mb-4">Verification Error</h1>
					<p class="text-gray-600 mb-8">
						{data.message || 'An error occurred during verification. Please try again.'}
					</p>
					
					<div class="space-y-4">
						<a 
							href="/login" 
							class="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
						>
							<span>🔐</span>
							<span>Go to Login</span>
						</a>
						
						<a 
							href="/" 
							class="w-full bg-gray-100 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
						>
							<span>🏠</span>
							<span>Back to Home</span>
						</a>
					</div>
				</div>

			{:else}
				<!-- Loading State -->
				<div class="text-center">
					<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg mb-6">
						<span class="text-3xl">⏳</span>
					</div>
					<h1 class="text-3xl font-bold text-gray-900 mb-4">Verifying Email</h1>
					<p class="text-gray-600">
						Please wait while we verify your email address...
					</p>
					
					<div class="mt-6">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
					</div>
				</div>
			{/if}
		</div>
	</div>
</div>
