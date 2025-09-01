export type AdminEvent = {
	type: string;
	payload?: Record<string, unknown> | null;
	timestamp?: string;
};

type Client = {
	send: (event: AdminEvent) => void;
	close: () => void;
};

const clients = new Set<Client>();

export function subscribe(send: Client['send'], close: Client['close']) {
	const client: Client = { send, close };
	clients.add(client);
	return () => {
		clients.delete(client);
	};
}

export function broadcastAdminEvent(event: AdminEvent) {
	const enriched: AdminEvent = { ...event, timestamp: new Date().toISOString() };
	for (const client of clients) {
		try {
			client.send(enriched);
		} catch {
			try {
				client.close();
			} catch {}
			clients.delete(client);
		}
	}
}

export function startHeartbeat(intervalMs = 25000) {
	const timer = setInterval(() => {
		broadcastAdminEvent({ type: 'heartbeat', payload: null });
	}, intervalMs);
	return () => clearInterval(timer);
}
