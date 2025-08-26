<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import * as Card from '$lib/components/ui/card/index.js';
  import { Users, UserCog, BotMessageSquare, ChartNoAxesColumnIncreasing } from '@lucide/svelte';

  export let stats: { totalUsers: number; adminUsers: number; totalMessages: number; systemStatus: string } = {
    totalUsers: 0,
    adminUsers: 0,
    totalMessages: 0,
    systemStatus: 'online'
  };
  export let loading: boolean = false;
  // Allow parent to control whether this component creates its own SSE connection
  export let useStream: boolean = true;

  let localStats = { ...stats };
  let isLoading = loading;
  let es: EventSource | null = null;

  async function refreshStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.ok) {
        localStats = await res.json();
      }
    } catch {}
  }

  onMount(() => {
    // initialize with passed props
    localStats = { ...stats };
    isLoading = loading;

    // Hook SSE to keep in sync with admin events
    if (useStream) {
      try {
        es = new EventSource('/api/admin/events');
        es.onmessage = (ev) => {
          try {
            const data = JSON.parse(ev.data || '{}');
            const type = data.type as string;
            if (type === 'heartbeat' || type === 'connected') return;

            if (type === 'stats_updated' || type === 'users_changed' || type === 'admin_action' || type === 'user_activity' || type === 'user_login' || type === 'user_logout') {
              refreshStats();
            }
          } catch {}
        };
        es.onerror = () => {
          es?.close();
          es = null;
        };
      } catch {}
    }
  });

  onDestroy(() => {
    es?.close();
    es = null;
  });

  $: if (stats) {
    // keep localStats in sync when parent prop changes
    localStats = { ...stats };
  }
  $: isLoading = loading;
</script>

<div class="mt-8">
  <h2 class="text-2xl font-bold mb-6">System Overview</h2>
  <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
    <Card.Root class="bg-card text-card-foreground border">
      <Card.Content class="p-6">
        <div class="flex items-center">
          <div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <Users class="h-6 w-6" />
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
            <div class="text-lg font-bold">
              {#if isLoading}
                <div class="h-6 w-12 bg-muted animate-pulse rounded"></div>
              {:else}
                {localStats.totalUsers}
              {/if}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="bg-card text-card-foreground border">
      <Card.Content class="p-6">
        <div class="flex items-center">
          <div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <BotMessageSquare class="h-6 w-6" />
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-muted-foreground">Chat Messages</h3>
            <div class="text-lg font-bold">
              {#if isLoading}
                <div class="h-6 w-12 bg-muted animate-pulse rounded"></div>
              {:else}
                {localStats.totalMessages}
              {/if}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="bg-card text-card-foreground border">
      <Card.Content class="p-6">
        <div class="flex items-center">
          <div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <UserCog class="h-6 w-6" />
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-muted-foreground">Admins</h3>
            <div class="text-lg font-bold">
              {#if isLoading}
                <div class="h-6 w-12 bg-muted animate-pulse rounded"></div>
              {:else}
                {localStats.adminUsers}
              {/if}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>

    <Card.Root class="bg-card text-card-foreground border">
      <Card.Content class="p-6">
        <div class="flex items-center">
          <div class="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
            <ChartNoAxesColumnIncreasing class="h-6 w-6" />
          </div>
          <div class="ml-4">
            <h3 class="text-sm font-medium text-muted-foreground">System Status</h3>
            <div class="text-lg font-bold {localStats.systemStatus === 'online' ? 'text-primary' : 'text-destructive'}">
              {#if isLoading}
                <div class="h-6 w-16 bg-muted animate-pulse rounded"></div>
              {:else}
                {localStats.systemStatus === 'online' ? 'Online' : 'Offline'}
              {/if}
            </div>
          </div>
        </div>
      </Card.Content>
    </Card.Root>
  </div>
</div>