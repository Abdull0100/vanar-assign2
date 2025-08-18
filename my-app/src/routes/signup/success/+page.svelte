<script lang="ts">
	import { page } from '$app/stores';
</script>

<div class="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center px-4">
	<div class="max-w-md w-full">
		<div class="bg-white shadow-xl rounded-2xl p-8 border border-gray-100">
			<!-- Success Icon -->
			<div class="text-center mb-8">
				<div class="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-green-500 to-blue-600 rounded-full shadow-lg mb-6">
					<span class="text-3xl">✅</span>
				</div>
				<h1 class="text-3xl font-bold text-gray-900 mb-2">Account Created!</h1>
				<p class="text-gray-600">Your account has been successfully created</p>
				<p class="text-purple-600 font-medium mt-2">🎉 Welcome! You can now try our AI Chat feature!</p>
			</div>

			<!-- Email Verification Notice -->
			<div class="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
				<div class="flex items-start space-x-3">
					<div class="flex-shrink-0">
						<span class="text-2xl">📧</span>
					</div>
					<div>
						<h3 class="text-lg font-semibold text-blue-900 mb-2">Check Your Email</h3>
						<p class="text-blue-800 text-sm leading-relaxed">
							We've sent a verification email to your inbox. Please click the verification link to activate your account.
						</p>
					</div>
				</div>
			</div>

			<!-- Important Notes -->
			<div class="space-y-4 mb-8">
				<div class="flex items-start space-x-3">
					<span class="text-yellow-500 text-lg">⚠️</span>
					<div>
						<h4 class="font-semibold text-gray-900 text-sm">Verification Required</h4>
						<p class="text-gray-600 text-sm">You must verify your email before you can log in to your account.</p>
					</div>
				</div>
				
				<div class="flex items-start space-x-3">
					<span class="text-blue-500 text-lg">⏰</span>
					<div>
						<h4 class="font-semibold text-gray-900 text-sm">Link Expires</h4>
						<p class="text-gray-600 text-sm">The verification link will expire in 24 hours.</p>
					</div>
				</div>

				<div class="flex items-start space-x-3">
					<span class="text-purple-500 text-lg">📁</span>
					<div>
						<h4 class="font-semibold text-gray-900 text-sm">Check Spam Folder</h4>
						<p class="text-gray-600 text-sm">If you don't see the email, check your spam or junk folder.</p>
					</div>
				</div>
			</div>

			<!-- Action Buttons -->
			<div class="space-y-4">
				<a 
					href="/chat" 
					class="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2"
				>
					<span>🤖</span>
					<span>Try AI Chat Now</span>
				</a>
				
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

			<!-- Development Notice -->
			{#if process.env.NODE_ENV === 'development'}
				<div class="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
					<h4 class="font-semibold text-yellow-800 text-sm mb-2">Development Mode</h4>
					<p class="text-yellow-700 text-xs">
						In development, verification emails are logged to the console instead of being sent. 
						Check your terminal for the verification link.
					</p>
				</div>
			{/if}
		</div>
	</div>
</div>
