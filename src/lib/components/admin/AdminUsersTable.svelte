<script lang="ts">
	export let users: Array<{
		id: string;
		name: string;
		email: string;
		role: string;
		createdAt: string;
		emailVerified: string | null;
	}> = [];
	export let currentUser: { id: string } | null = null;
	export let onUpdateRole: (userId: string, newRole: string) => void;
	export let onToggleStatus: (userId: string, currentStatus: boolean) => void;
	export let onDetails: (userId: string) => void;
	export let onDelete: (userId: string, nameOrEmail: string) => void;
	export let formatDateOnly: (d: string) => string;
</script>

<div class="overflow-hidden bg-white shadow sm:rounded-md">
	<div class="px-4 py-5 sm:px-6">
		<h3 class="text-lg leading-6 font-medium text-gray-900">User Management</h3>
		<p class="mt-1 max-w-2xl text-sm text-gray-500">Manage user roles, status, and view detailed statistics</p>
	</div>

	<div class="overflow-x-auto">
		<table class="min-w-full divide-y divide-gray-200">
			<thead class="bg-gray-50">
				<tr>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">User</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Role</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Status</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Joined</th>
					<th class="px-6 py-3 text-left text-xs font-medium tracking-wider text-gray-500 uppercase">Actions</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-gray-200 bg-white">
				{#each users as userItem (userItem.id)}
					<tr class="hover:bg-gray-50">
						<td class="px-6 py-4 whitespace-nowrap">
							<div class="flex items-center">
								<div class="h-10 w-10 flex-shrink-0">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-300">
										<span class="text-sm font-medium text-gray-700">
											{userItem.name ? userItem.name.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
										</span>
									</div>
								</div>
								<div class="ml-4">
									<div class="text-sm font-medium text-gray-900">
										{userItem.name || 'No name'}
									</div>
									<div class="text-sm text-gray-500">{userItem.email}</div>
								</div>
							</div>
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							{#if currentUser && userItem.id === currentUser.id}
								<div class="flex items-center space-x-2">
									<span class="text-sm font-medium text-gray-900">{userItem.role}</span>
									<span class="text-xs text-gray-500">(Current user)</span>
								</div>
							{:else}
								<select
									value={userItem.role}
									on:change={(e) => onUpdateRole(userItem.id, (e.target as HTMLSelectElement).value)}
									class="rounded-md border-gray-300 text-sm text-gray-900 focus:border-indigo-500 focus:ring-indigo-500"
								>
									<option value="user">User</option>
									<option value="admin">Admin</option>
								</select>
							{/if}
						</td>
						<td class="px-6 py-4 whitespace-nowrap">
							<span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium {userItem.emailVerified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
								{userItem.emailVerified ? 'Active' : 'Inactive'}
							</span>
						</td>
						<td class="px-6 py-4 text-sm whitespace-nowrap text-gray-500">
							{formatDateOnly(userItem.createdAt)}
						</td>
						<td class="px-6 py-4 text-sm font-medium whitespace-nowrap">
							{#if currentUser && userItem.id === currentUser.id}
								<span class="text-gray-400">N/A</span>
							{:else}
								<div class="flex space-x-2">
									<button on:click={() => onToggleStatus(userItem.id, !!userItem.emailVerified)} class="text-indigo-600 hover:text-indigo-900">{userItem.emailVerified ? 'Disable' : 'Enable'}</button>
									<button on:click={() => onDetails(userItem.id)} class="text-blue-600 hover:text-blue-900">Details</button>
									<button on:click={() => onDelete(userItem.id, userItem.name || userItem.email)} class="text-red-600 hover:text-red-900">Delete</button>
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>


