<script lang="ts">
	export let showDeleteModal: boolean = false;
	export let deleteTarget: { id: string; title: string } | null = null;
	export let showDeleteAllModal: boolean = false;
	export let deleteAllTarget: { title: string } | null = null;
	export let onCloseDelete: () => void;
	export let onConfirmDelete: () => void;
	export let onCloseDeleteAll: () => void;
	export let onConfirmDeleteAll: () => void;
</script>

{#if showDeleteModal && deleteTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-opacity-10 transition-opacity duration-300" aria-hidden="true" on:click={onCloseDelete}></div>
		<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
			<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
				<div class="sm:flex sm:items-start">
					<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
						<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">Delete Conversation</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">Are you sure you want to delete <strong>"{deleteTarget.title}"</strong>?</p>
							<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div class="flex items-start">
									<svg class="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
									</svg>
									<div class="text-sm text-red-700">
										<strong>PERMANENT DELETION:</strong> This entire conversation will be permanently erased from:
										<ul class="mt-1 ml-4 list-disc">
											<li>Your local chat history</li>
											<li>The database</li>
											<li>All backup systems</li>
										</ul>
										<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="bg-indigo-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
				<button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200" on:click={onConfirmDelete}>Delete Conversation</button>
				<button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-indigo-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200" on:click={onCloseDelete}>Cancel</button>
			</div>
		</div>
	</div>
{/if}

{#if showDeleteAllModal && deleteAllTarget}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4" aria-labelledby="modal-title-all" role="dialog" aria-modal="true">
		<div class="fixed inset-0 bg-opacity-50 transition-opacity duration-300" aria-hidden="true" on:click={onCloseDeleteAll}></div>
		<div class="relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden transform transition-all">
			<div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
				<div class="sm:flex sm:items-start">
					<div class="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
						<svg class="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
						</svg>
					</div>
					<div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
						<h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title-all">Clear All Chat History</h3>
						<div class="mt-2">
							<p class="text-sm text-gray-500">Are you sure you want to clear <strong>{deleteAllTarget.title}</strong>?</p>
							<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
								<div class="flex items-start">
									<svg class="h-5 w-5 text-red-400 mt-0.5 mr-2 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
										<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
									</svg>
									<div class="text-sm text-red-700">
										<strong>PERMANENT DELETION:</strong> ALL conversations and messages will be permanently erased from:
										<ul class="mt-1 ml-4 list-disc">
											<li>Your local chat history</li>
											<li>The database</li>
											<li>All backup systems</li>
										</ul>
										<p class="mt-2 font-medium">This action cannot be undone and provides guaranteed permanent erasure from all systems.</p>
										<p class="mt-1 font-medium text-red-800">This will remove ALL your chat data permanently.</p>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="bg-indigo-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
				<button type="button" class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200" on:click={onConfirmDeleteAll}>Clear All History</button>
				<button type="button" class="mt-3 w-full inline-flex justify-center rounded-md border border-indigo-200 shadow-sm px-4 py-2 bg-white text-base font-medium text-neutral-700 hover:bg-indigo-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-300 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors duration-200" on:click={onCloseDeleteAll}>Cancel</button>
			</div>
		</div>
	</div>
{/if}


