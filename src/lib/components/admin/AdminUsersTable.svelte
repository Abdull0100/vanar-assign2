<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Select from '$lib/components/ui/select';

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

<div class="font-sans admin-users-font">
<Card.Root>
	<Card.Header>
		<Card.Title class="text-white">User Management</Card.Title>
		<Card.Description class="text-white">Manage user roles, status, and view detailed statistics</Card.Description>
	</Card.Header>
	<Card.Content>
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<Table.Head class="text-white">User</Table.Head>
					<Table.Head class="text-white">Role</Table.Head>
					<Table.Head class="text-white">Status</Table.Head>
					<Table.Head class="text-white">Joined</Table.Head>
					<Table.Head class="text-white">Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each users as userItem (userItem.id)}
					<Table.Row>
						<Table.Cell>
							<div class="flex items-center">
								<div class="h-10 w-10 flex-shrink-0">
									<div class="flex h-10 w-10 items-center justify-center rounded-full bg-muted">
										<span class="text-sm font-medium text-white">
											{userItem.name ? userItem.name.charAt(0).toUpperCase() : userItem.email.charAt(0).toUpperCase()}
										</span>
									</div>
								</div>
								<div class="ml-4">
									<div class="text-sm font-medium text-white">
										{userItem.name || 'No name'}
									</div>
									<div class="text-sm text-white">{userItem.email}</div>
								</div>
							</div>
						</Table.Cell>
						<Table.Cell>
							{#if currentUser && userItem.id === currentUser.id}
								<div class="flex items-center space-x-2">
									<span class="text-sm font-medium text-white">{userItem.role}</span>
									<Badge variant="outline" class="text-white">Current user</Badge>
								</div>
							{:else}
								<Select.Root type="single" bind:value={userItem.role} onValueChange={(value) => onUpdateRole(userItem.id, value)}>
									<Select.Trigger class="w-32 text-white">
										<span data-slot="select-value" class="capitalize text-white">{userItem.role}</span>
									</Select.Trigger>
									<Select.Content class="text-white">
										<Select.Item value="user" class="text-white">User</Select.Item>
										<Select.Item value="admin" class="text-white">Admin</Select.Item>
									</Select.Content>
								</Select.Root>
							{/if}
						</Table.Cell>
						<Table.Cell>
							<Badge variant={userItem.emailVerified ? 'default' : 'secondary'} class="text-white">
								{userItem.emailVerified ? 'Active' : 'Inactive'}
							</Badge>
						</Table.Cell>
						<Table.Cell class="text-white">
							{formatDateOnly(userItem.createdAt)}
						</Table.Cell>
						<Table.Cell>
							{#if currentUser && userItem.id === currentUser.id}
								<span class="text-white">N/A</span>
							{:else}
								<div class="flex space-x-2">
									<Button
										variant="outline"
										size="sm"
										type="button"
										onclick={() => onToggleStatus(userItem.id, !!userItem.emailVerified)}
										class="text-white"
									>
										{userItem.emailVerified ? 'Disable' : 'Enable'}
									</Button>
									<Button
										variant="outline"
										size="sm"
										type="button"
										onclick={() => onDetails(userItem.id)}
										class="text-white"
									>
										Details
									</Button>
									<Button
										variant="destructive"
										size="sm"
										type="button"
										onclick={() => onDelete(userItem.id, userItem.name || userItem.email)}
										class="text-white"
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
</div>

<style>
	:global(.admin-users-font h1),
	:global(.admin-users-font h2),
	:global(.admin-users-font h3),
	:global(.admin-users-font h4),
	:global(.admin-users-font h5),
	:global(.admin-users-font h6) {
		font-family: var(--font-sans) !important;
	}
</style>


