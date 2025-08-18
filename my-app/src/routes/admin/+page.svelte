<script lang="ts">
	let { data } = $props<{ data: { user: any } }>();
</script>

<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="bg-white shadow-lg rounded-lg border border-gray-200 p-8">
    <div class="text-center">
      <h1 class="text-4xl font-bold text-gray-900 mb-4">
        		Admin Panel 🔐
      </h1>
      <p class="text-lg text-gray-600 mb-8">
        Welcome, {data.user.name}! You have administrative privileges.
      </p>
      
      <div class="bg-red-50 p-6 rounded-lg border border-red-200 mb-8">
        <h2 class="text-xl font-semibold text-red-800 mb-2">Admin Controls</h2>
        <p class="text-red-700">This area is restricted to administrators only.</p>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        <div class="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <div class="text-blue-600 text-2xl mb-2">👥</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">User Management</h3>
          <p class="text-gray-600">Manage user accounts and permissions</p>
        </div>
        
        <div class="bg-green-50 p-6 rounded-lg border border-green-200">
          <div class="text-green-600 text-2xl mb-2">📊</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Analytics</h3>
          <p class="text-gray-600">View system-wide statistics</p>
        </div>
        
        <div class="bg-purple-50 p-6 rounded-lg border border-purple-200">
          <div class="text-purple-600 text-2xl mb-2">⚙️</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">System Settings</h3>
          <p class="text-gray-600">Configure application settings</p>
        </div>
      </div>
    </div>
  </div>
</div>
