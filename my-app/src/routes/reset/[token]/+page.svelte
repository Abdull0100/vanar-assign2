<script lang="ts">
	let { data, form } = $props<{ data: any; form: any }>();
</script>

<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-md w-full space-y-8">
		<div>
			<h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
				Reset your password
			</h2>
			<p class="mt-2 text-center text-sm text-gray-600">
				Enter your new password below
			</p>
		</div>
		
		<div class="bg-white py-8 px-6 shadow-lg rounded-lg border border-gray-200">
			{#if data.status === 'expired'}
				<!-- Expired Token -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<span class="text-2xl">⏰</span>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Link Expired</h3>
					<p class="text-sm text-gray-600 mb-6">
						Your password reset link has expired. Please request a new one.
					</p>
					<a 
						href="/forgot" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Request New Link
					</a>
				</div>

			{:else if data.status === 'invalid'}
				<!-- Invalid Token -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<span class="text-2xl">❌</span>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Invalid Link</h3>
					<p class="text-sm text-gray-600 mb-6">
						The reset link is invalid or has already been used.
					</p>
					<a 
						href="/forgot" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Request New Link
					</a>
				</div>

			{:else if data.status === 'error'}
				<!-- Error -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4">
						<span class="text-2xl">⚠️</span>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Error</h3>
					<p class="text-sm text-gray-600 mb-6">
						{data.message || 'An error occurred. Please try again.'}
					</p>
					<a 
						href="/forgot" 
						class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Try Again
					</a>
				</div>

			{:else if data.status === 'valid'}
				<!-- Valid Token - Show Reset Form -->
				<form method="POST" action="?/reset" class="space-y-6">
					{#if data.user}
						<div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
							<p class="text-blue-800 text-sm">
								<strong>Reset password for:</strong><br>
								{data.user.email}
							</p>
						</div>
					{/if}
					
					<div>
						<label for="password" class="block text-sm font-medium text-gray-700 mb-2">
							New Password
						</label>
						<input 
							type="password" 
							id="password" 
							name="password" 
							required 
							minlength="6"
							autocomplete="new-password"
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
							placeholder="Enter your new password"
						/>
					</div>
					
					<div>
						<label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-2">
							Confirm New Password
						</label>
						<input 
							type="password" 
							id="confirmPassword" 
							name="confirmPassword" 
							required 
							minlength="6"
							autocomplete="new-password"
							class="appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm transition-colors"
							placeholder="Confirm your new password"
						/>
					</div>
					
					{#if form?.error}
						<div class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
							{form.error}
						</div>
					{/if}
					
					<button 
						type="submit" 
						class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
					>
						Reset Password
					</button>
				</form>
			{:else}
				<!-- Loading State -->
				<div class="text-center">
					<div class="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
						<div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
					</div>
					<h3 class="text-lg font-medium text-gray-900 mb-2">Validating Reset Link</h3>
					<p class="text-sm text-gray-600">
						Please wait while we validate your reset link...
					</p>
				</div>
			{/if}
			
			<div class="mt-6 text-center">
				<p class="text-sm text-gray-600">
					Remember your password? 
					<a href="/login" class="font-medium text-blue-600 hover:text-blue-500 transition-colors">
						Sign in here
					</a>
				</p>
			</div>
		</div>
	</div>
</div>
