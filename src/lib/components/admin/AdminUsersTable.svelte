<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';
	import AdminUserModal from './AdminUserModal.svelte';

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
	export let onDelete: (userId: string, nameOrEmail: string) => void;
	export let formatDateOnly: (d: string) => string;

	// Modal state
	let modalOpen = false;
	let selectedUser: any = null;

	function handleDetails(userId: string) {
		const user = users.find(u => u.id === userId);
		if (user) {
			// Normalize `active` for modal
			selectedUser = {
				...user,
				active: !!user.emailVerified
			};
			modalOpen = true;
		}
	}
</script>

<div class="font-sans">
	<Card.Root>
		<Card.Header>
			<Card.Title>User Management</Card.Title>
			<Card.Description>Manage user roles, status, and view detailed statistics</Card.Description>
		</Card.Header>
		<Card.Content>
			<Table.Root>
				<Table.Header>
					<Table.Row>
						<Table.Head>User</Table.Head>
						<Table.Head>Role</Table.Head>
						<Table.Head>Status</Table.Head>
						<Table.Head>Joined</Table.Head>
						<Table.Head>Actions</Table.Head>
					</Table.Row>
				</Table.Header>
				<Table.Body>
					{#each users as userItem (userItem.id)}
						<Table.Row>
							<Table.Cell>
								<div class="flex items-center">
									<div class="h-10 w-10 flex-shrink-0">
										<div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
											<span class="text-sm font-medium">
												{userItem.name ? userItem.name.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
											</span>
										</div>
									</div>
									<div class="ml-4">
										<div class="text-sm font-medium">{userItem.name || 'No name'}</div>
										<div class="text-sm">{userItem.email}</div>
									</div>
								</div>
							</Table.Cell>

							<Table.Cell>
								{#if currentUser && userItem.id === currentUser.id}
									<div class="flex items-center space-x-2">
										<span class="text-sm font-medium">{userItem.role}</span>
										<Badge variant="outline">Current user</Badge>
									</div>
								{:else}
									<Select.Root
										type="single"
										bind:value={userItem.role}
										onValueChange={(value) => onUpdateRole(userItem.id, value)}
									>
										<Select.Trigger class="w-32">
											<span data-slot="select-value" class="capitalize">{userItem.role}</span>
										</Select.Trigger>
										<Select.Content>
											<Select.Item value="user">User</Select.Item>
											<Select.Item value="admin">Admin</Select.Item>
										</Select.Content>
									</Select.Root>
								{/if}
							</Table.Cell>

							<Table.Cell>
								<Badge variant={userItem.emailVerified ? 'default' : 'secondary'}>
									{userItem.emailVerified ? 'Active' : 'Inactive'}
								</Badge>
							</Table.Cell>

							<Table.Cell>{formatDateOnly(userItem.createdAt)}</Table.Cell>

							<Table.Cell>
								{#if currentUser && userItem.id === currentUser.id}
									<span>N/A</span>
								{:else}
									<div class="flex space-x-2">
										<Button
											variant="outline"
											size="sm"
											type="button"
											onclick={() => onToggleStatus(userItem.id, !!userItem.emailVerified)}
										>
											{userItem.emailVerified ? 'Disable' : 'Enable'}
										</Button>
										<Button
											variant="outline"
											size="sm"
											type="button"
											onclick={() => handleDetails(userItem.id)}
										>
											Details
										</Button>
										<Button
											variant="destructive"
											size="sm"
											type="button"
											onclick={() => onDelete(userItem.id, userItem.name || userItem.email)}
										>
											Delete
										</Button>
									</div>
								{/if}
							</Table.Cell>
						</Table.Row>
					{/each}
				</Table.Body>
			</Table.Root>
		</Card.Content>
	</Card.Root>

	<!-- Modal -->
	<AdminUserModal
		{selectedUser}
		open={modalOpen}
		onClose={() => { modalOpen = false; selectedUser = null; }}
	/>
</div>
