<script lang="ts">
	let { data } = $props<{ data: { user: any } }>();
	
	let isMakingAdmin = $state(false);
	let adminMessage = $state<string | null>(null);

	async function makeAdmin() {
		if (isMakingAdmin) return;
		
		isMakingAdmin = true;
		adminMessage = null;
		
		try {
			const response = await fetch('/api/make-admin', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				}
			});
			
			const result = await response.json();
			
			if (result.success) {
				adminMessage = result.message;
				// Update the user data to reflect admin status
				data.user.role = 'admin';
			} else {
				adminMessage = result.error || 'Failed to make admin';
			}
		} catch (error) {
			adminMessage = 'Error making admin';
		} finally {
			isMakingAdmin = false;
		}
	}
</script>

<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white shadow-lg rounded-lg border border-gray-200 p-8">
    <div class="text-center mb-8">
      <h1 class="text-3xl font-bold text-gray-900 mb-2">Your Profile</h1>
      <p class="text-gray-600">Manage your account information</p>
    </div>
    
    {#if data.user}
      <div class="max-w-2xl mx-auto">
        <div class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-lg border border-gray-200">
            <div class="flex items-center space-x-4">
              <div class="flex-shrink-0">
                <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-2xl text-blue-600 font-semibold">
                    {data.user.name ? data.user.name.charAt(0).toUpperCase() : 'U'}
                  </span>
                </div>
              </div>
              <div class="flex-1">
                <h2 class="text-xl font-semibold text-gray-900">
                  {data.user.name || 'Not provided'}
                </h2>
                <p class="text-gray-600">{data.user.email}</p>
              </div>
              <div class="flex-shrink-0">
                {#if data.user.verified}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                    </svg>
                    Verified
                  </span>
                {:else}
                  <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    <svg class="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                    </svg>
                    Not Verified
                  </span>
                {/if}
              </div>
            </div>
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white p-6 rounded-lg border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Account Details</h3>
              <dl class="space-y-3">
                <div>
                  <dt class="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd class="text-sm text-gray-900">{data.user.name || 'Not provided'}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Email Address</dt>
                  <dd class="text-sm text-gray-900">{data.user.email}</dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Account Status</dt>
                  <dd class="text-sm text-gray-900">
                    {data.user.verified ? 'Verified' : 'Not Verified'}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm font-medium text-gray-500">Role</dt>
                  <dd class="text-sm text-gray-900">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium {data.user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}">
                      {data.user.role === 'admin' ? '🔐 Admin' : '👤 User'}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
            
            <div class="bg-white p-6 rounded-lg border border-gray-200">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div class="space-y-3">
                {#if data.user.role !== 'admin'}
                  <button 
                    onclick={makeAdmin}
                    disabled={isMakingAdmin}
                    class="w-full text-left px-4 py-2 text-sm text-purple-700 hover:bg-purple-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isMakingAdmin ? 'Making Admin...' : '🔐 Make Me Admin (Testing)'}
                  </button>
                  
                  {#if adminMessage}
                    <div class="mt-2 p-2 text-xs rounded {adminMessage.includes('success') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                      {adminMessage}
                    </div>
                  {/if}
                {:else}
                  <div class="w-full text-left px-4 py-2 text-sm text-green-700 bg-green-50 rounded-md">
                    ✅ You are an Admin!
                  </div>
                  <a 
                    href="/admin" 
                    class="block w-full text-left px-4 py-2 text-sm text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                  >
                    🎛️ Go to Admin Dashboard
                  </a>
                {/if}
                
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  Edit Profile
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  Change Password
                </button>
                <button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                  Privacy Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    {:else}
      <div class="text-center py-12">
        <div class="text-gray-400 text-6xl mb-4">👤</div>
        <h3 class="text-lg font-medium text-gray-900 mb-2">No user data available</h3>
        <p class="text-gray-600">Please try refreshing the page or contact support.</p>
      </div>
    {/if}
  </div>
</div>
