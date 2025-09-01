<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Tabs, TabsList, TabsTrigger, TabsContent } from '$lib/components/ui/tabs';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { Card, CardContent } from '$lib/components/ui/card';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';

	export let selectedUser: any = null;
	export let open: boolean;
	export let onClose: () => void;

	let tabValue: string = 'overview';
</script>

{#if selectedUser}
	<Dialog.Root
		bind:open
		onOpenChange={(val) => {
			if (!val) onClose();
		}}
	>
		<Dialog.Content
			class="flex max-h-[90vh] w-[90vw] max-w-5xl flex-col rounded-2xl bg-card font-sans text-card-foreground shadow-xl"
		>
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<Dialog.Title class="text-lg font-medium">
					User Details: {selectedUser.name || selectedUser.email}
				</Dialog.Title>
				<Dialog.Close aria-label="Close user details modal" />
			</div>

			<!-- Scrollable body -->
			<div class="flex-1 space-y-6 overflow-y-auto px-6 py-4">
				<!-- User Info -->
				<div class="flex flex-col md:flex-row md:items-center md:justify-between">
					<div>
						<h3 class="font-sans text-xl font-semibold">{selectedUser.name}</h3>
						<p class="text-muted-foreground">{selectedUser.email}</p>
					</div>
					<Badge variant={selectedUser.active ? 'default' : 'secondary'}>
						{selectedUser.active ? 'Active' : 'Inactive'}
					</Badge>
				</div>

				<Separator />

				<!-- Tabs -->
				<Tabs bind:value={tabValue}>
					<TabsList>
						<TabsTrigger value="overview">Overview</TabsTrigger>
						<TabsTrigger value="sessions">Sessions</TabsTrigger>
						<TabsTrigger value="activity">Activity</TabsTrigger>
					</TabsList>

					<div class="mt-4 max-h-[60vh] min-h-[400px] overflow-y-auto">
						<!-- Overview Tab -->
						<TabsContent value="overview">
							<Card>
								<CardContent class="space-y-2 p-4">
									<p>
										<span class="font-semibold text-card-foreground">ID:</span>
										{selectedUser.id}
									</p>
									<p>
										<span class="font-semibold text-card-foreground">Role:</span>
										{selectedUser.role}
									</p>
									<p>
										<span class="font-semibold text-card-foreground">Joined:</span>
										{selectedUser.createdAt}
									</p>
								</CardContent>
							</Card>
						</TabsContent>

						<!-- Sessions Tab -->
						<TabsContent value="sessions">
							<Card>
								<CardContent class="p-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Device</TableHead>
												<TableHead>IP</TableHead>
												<TableHead>Last Active</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each selectedUser.sessions || [] as session}
												<TableRow>
													<TableCell>{session.device}</TableCell>
													<TableCell>{session.ip}</TableCell>
													<TableCell>{session.lastActive}</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</TabsContent>

						<!-- Activity Tab -->
						<TabsContent value="activity">
							<Card>
								<CardContent class="p-0">
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>Action</TableHead>
												<TableHead>Timestamp</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each selectedUser.activity || [] as event}
												<TableRow>
													<TableCell>{event.action}</TableCell>
													<TableCell>{event.timestamp}</TableCell>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								</CardContent>
							</Card>
						</TabsContent>
					</div>
				</Tabs>
			</div>
		</Dialog.Content>
	</Dialog.Root>
{/if}
