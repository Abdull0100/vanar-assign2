<script lang="ts">
	export let selectedUser: any = null;
	export let userStats: any = null;
	export let userActivities: any[] = [];
	export let userSessions: any[] = [];
	export let modalActiveTab: 'sessions' | 'activities' | 'stats' = 'sessions';
	export let formatDate: (d: string) => string;
	export let formatDuration: (a: string, b?: string) => string;
	export let getPaginatedActivities: () => any[];
	export let getTotalPages: () => number;
	export let activitiesPage: number;
	export let nextActivitiesPage: () => void;
	export let prevActivitiesPage: () => void;
	export let closeUserModal: () => void;
</script>

{#if selectedUser}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" on:click={closeUserModal}></div>

		<div class="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden transform transition-all">
			<div class="bg-white px-6 py-4 border-b border-gray-200">
				<div class="flex items-center justify-between">
					<h3 class="text-lg font-medium text-gray-900" id="modal-title">User Details: {selectedUser.name || selectedUser.email}</h3>
					<button on:click={closeUserModal} class="text-gray-400 hover:text-gray-600" aria-label="Close user details modal">
						<svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
						</svg>
					</button>
				</div>
			</div>

			<div class="px-6 py-4 overflow-hidden flex flex-col h-full">
				<div class="bg-gray-50 rounded-lg p-4 mb-6 flex-shrink-0">
					<h4 class="text-md font-medium text-gray-900 mb-3">User Information</h4>
					<div class="grid grid-cols-2 gap-4">
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Name</h5>
							<p class="mt-1 text-sm text-gray-900">{selectedUser.name || 'No name'}</p>
						</div>
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Email</h5>
							<p class="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
						</div>
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Role</h5>
							<p class="mt-1 text-sm text-gray-900">{selectedUser.role}</p>
						</div>
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Joined</h5>
							<p class="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
						</div>
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Last Activity</h5>
							<div class="mt-1 text-sm text-gray-900">
								{#if userStats && userStats.lastActivityDetails}
									<div class="space-y-1">
										<div class="font-medium text-gray-900">{userStats.lastActivityDetails.description || userStats.lastActivityDetails.activityType || 'Unknown activity'}</div>
										<div class="text-xs text-gray-500">{formatDate(userStats.lastActivityDetails.createdAt)}</div>
									</div>
								{:else if userStats && userStats.lastActivity}
									<div class="space-y-1">
										<div class="text-gray-400">Unknown activity</div>
										<div class="text-xs text-gray-500">{formatDate(userStats.lastActivity)}</div>
									</div>
								{:else}
									<span class="text-gray-400">Never</span>
								{/if}
							</div>
						</div>
						<div>
							<h5 class="block text-sm font-medium text-gray-700">Last Login</h5>
							<div class="mt-1 text-sm text-gray-900">{#if userStats && userStats.lastLogin}{formatDate(userStats.lastLogin)}{:else}<span class="text-gray-400">Never</span>{/if}</div>
						</div>
					</div>
				</div>

				<div class="border-b border-gray-200 mb-6 flex-shrink-0">
					<nav class="-mb-px flex space-x-8">
						<button on:click={() => (modalActiveTab = 'sessions')} class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'sessions' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">User Sessions ({userSessions.length})</button>
						<button on:click={() => (modalActiveTab = 'activities')} class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'activities' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">User Activities ({userActivities.length})</button>
						<button on:click={() => (modalActiveTab = 'stats')} class="py-2 px-1 border-b-2 font-medium text-sm {modalActiveTab === 'stats' ? 'border-indigo-500 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}">Chat Stats</button>
					</nav>
				</div>

				<div class="flex-1 overflow-y-auto min-h-0">
					{#if modalActiveTab === 'sessions'}
						<div class="space-y-4">
							<h4 class="text-lg font-medium text-gray-900">User Sessions</h4>
							{#if userSessions.length > 0}
								<div class="overflow-x-auto max-h-96 overflow-y-auto">
									<table class="min-w-full divide-y divide-gray-200">
										<thead class="bg-gray-50">
											<tr>
												<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
												<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Login Time</th>
												<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Logout Time</th>
												<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
												<th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
											</tr>
										</thead>
										<tbody class="bg-white divide-y divide-gray-200">
											{#each userSessions as session}
												<tr class="hover:bg-gray-50">
													<td class="px-4 py-3 text-sm text-gray-900">{session.ipAddress || 'Unknown'}</td>
													<td class="px-4 py-3 text-sm text-gray-900">{formatDate(session.loginTime)}</td>
													<td class="px-4 py-3 text-sm text-gray-900">{session.logoutTime ? formatDate(session.logoutTime) : 'Active'}</td>
													<td class="px-4 py-3 text-sm">
														{#if session.isActive}
															<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Active</span>
														{:else}
															<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Ended</span>
														{/if}
													</td>
													<td class="px-4 py-3 text-sm text-gray-900">{session.logoutTime ? formatDuration(session.loginTime, session.logoutTime) : formatDuration(session.loginTime)}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<p class="text-gray-500 text-center py-8">No sessions found for this user.</p>
							{/if}
						</div>
					{/if}

					{#if modalActiveTab === 'activities'}
						<div class="space-y-4">
							<h4 class="text-lg font-medium text-gray-900">User Activities</h4>
							{#if userActivities.length > 0}
								<div class="space-y-3 max-h-96 overflow-y-auto">
									{#each getPaginatedActivities() as activity}
										<div class="bg-gray-50 rounded-lg p-4">
											<div class="flex items-start justify-between">
												<div class="flex-1">
													<div class="flex items-center space-x-3 mb-2">
														<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{activity.activityType}</span>
														<span class="text-sm text-gray-500">{formatDate(activity.createdAt)}</span>
													</div>
													<div class="text-sm font-medium text-gray-900 mb-2">{activity.description}</div>
													{#if activity.ipAddress}
														<div class="text-xs text-gray-500 mt-2">IP: {activity.ipAddress}</div>
													{/if}
												</div>
											</div>
										</div>
									{/each}

									{#if getTotalPages() > 1}
										<div class="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
											<div class="flex flex-1 justify-between sm:hidden">
												<button on:click={prevActivitiesPage} disabled={activitiesPage === 1} class="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Previous</button>
												<button on:click={nextActivitiesPage} disabled={activitiesPage === getTotalPages()} class="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">Next</button>
											</div>
											<div class="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
												<div>
													<p class="text-sm text-gray-700">Showing <span class="font-medium">{((activitiesPage - 1) * 10) + 1}</span> to <span class="font-medium">{Math.min(activitiesPage * 10, userActivities.length)}</span> of <span class="font-medium">{userActivities.length}</span> results</p>
												</div>
												<div>
													<nav class="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
														<button on:click={prevActivitiesPage} disabled={activitiesPage === 1} class="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
															<span class="sr-only">Previous</span>
															<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																<path fill-rule="evenodd" d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z" clip-rule="evenodd" />
															</svg>
														</button>
														{#each Array.from({ length: getTotalPages() }, (_, i) => i + 1) as pageNum}
															<button on:click={() => (activitiesPage = pageNum)} class="relative inline-flex items-center px-4 py-2 text-sm font-semibold {pageNum === activitiesPage ? 'z-10 bg-indigo-600 text-white' : 'text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50'} ring-inset ring-gray-300">{pageNum}</button>
														{/each}
														<button on:click={nextActivitiesPage} disabled={activitiesPage === getTotalPages()} class="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed">
															<span class="sr-only">Next</span>
															<svg class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
																<path fill-rule="evenodd" d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z" clip-rule="evenodd" />
															</svg>
														</button>
													</nav>
												</div>
											</div>
										</div>
									{/if}
								</div>
							{:else}
								<p class="text-gray-500 text-center py-8">No activities found for this user.</p>
							{/if}
						</div>
					{/if}

					{#if modalActiveTab === 'stats'}
						<div class="space-y-6 max-h-96 overflow-y-auto">
							<h4 class="text-lg font-medium text-gray-900">Chat Statistics</h4>
							{#if userStats}
								<div class="grid grid-cols-2 md:grid-cols-4 gap-6">
									<div class="bg-blue-50 rounded-lg p-4 text-center">
										<div class="text-3xl font-bold text-blue-600">{userStats.totalChatMessages || 0}</div>
										<div class="text-sm text-blue-700 font-medium">Total Chat Messages</div>
									</div>
									<div class="bg-green-50 rounded-lg p-4 text-center">
										<div class="text-3xl font-bold text-green-600">{userStats.totalConversations || 0}</div>
										<div class="text-sm text-green-700 font-medium">Total Conversations</div>
									</div>
									<div class="bg-purple-50 rounded-lg p-4 text-center">
										<div class="text-3xl font-bold text-purple-600">{userStats.profileUpdateCount || 0}</div>
										<div class="text-sm text-purple-700 font-medium">Profile Updates</div>
									</div>
									<div class="bg-orange-50 rounded-lg p-4 text-center">
										<div class="text-3xl font-bold text-orange-600">{userStats.passwordChangeCount || 0}</div>
										<div class="text-sm text-orange-700 font-medium">Password Changes</div>
									</div>
								</div>
							{:else}
								<p class="text-gray-500 text-center py-8">No statistics available for this user.</p>
							{/if}
						</div>
					{/if}
				</div>
			</div>
		</div>
	</div>
{/if}


