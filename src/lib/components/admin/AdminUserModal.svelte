<script lang="ts">
	import * as Dialog from "$lib/components/ui/dialog";
	import { Tabs, TabsList, TabsTrigger, TabsContent } from "$lib/components/ui/tabs";
	import { Badge } from "$lib/components/ui/badge";
	import { Separator } from "$lib/components/ui/separator";
	import { Card, CardContent } from "$lib/components/ui/card";
	import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "$lib/components/ui/table";

	export let selectedUser: any = null;
	export let open: boolean;
	export let onClose: () => void;

	let tabValue: string = "overview";
</script>




{#if selectedUser}
	<Dialog.Root bind:open onOpenChange={(val) => { if (!val) onClose(); }}>
		<Dialog.Content
			class="bg-card font-sans text-card-foreground max-h-[90vh] w-[90vw] max-w-5xl flex flex-col rounded-2xl shadow-xl"
		>
			<!-- Header -->
			<div class="px-6 py-4 border-b border-border flex items-center justify-between">
				<Dialog.Title class="text-lg font-medium">
					User Details: {selectedUser.name || selectedUser.email}
				</Dialog.Title>
				<Dialog.Close aria-label="Close user details modal" />
			</div>

			<!-- Scrollable body -->
			<div class="flex-1 overflow-y-auto px-6 py-4 space-y-6">
				<!-- User Info -->
				<div class="flex flex-col md:flex-row md:items-center md:justify-between">
					<div>
						<h3 class="text-xl font-semibold font-sans">{selectedUser.name}</h3>
						<p class="text-muted-foreground">{selectedUser.email}</p>
					</div>
					<Badge variant={selectedUser.active ? "default" : "secondary"}>
						{selectedUser.active ? "Active" : "Inactive"}
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

					<div class="min-h-[400px] max-h-[60vh] overflow-y-auto mt-4">
						<!-- Overview Tab -->
						<TabsContent value="overview">
							<Card>
								<CardContent class="p-4 space-y-2">
									<p><span class="font-semibold text-card-foreground">ID:</span> {selectedUser.id}</p>
									<p><span class="font-semibold text-card-foreground">Role:</span> {selectedUser.role}</p>
									<p><span class="font-semibold text-card-foreground">Joined:</span> {selectedUser.createdAt}</p>
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