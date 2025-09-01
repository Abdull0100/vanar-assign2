import type { RequestHandler } from './$types';
import { subscribe, startHeartbeat } from './hub';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ locals }) => {
	const session = await locals.getSession?.();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}
	if (session.user.role !== 'admin') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			const send = (event: { type: string; payload?: any; timestamp?: string }) => {
				const data = `data: ${JSON.stringify(event)}\n\n`;
				controller.enqueue(encoder.encode(data));
			};

			const close = () => controller.close();
			const unsubscribe = subscribe(send, close);

			// Initial hello event
			send({ type: 'connected', payload: { role: 'admin' } });

			// Heartbeat to keep proxies happy
			const stopHeartbeat = startHeartbeat();

			// Close handling
			// @ts-ignore: controller has no signal here, rely on try/catch on enqueue failures
			controller.signal?.addEventListener?.('abort', () => {
				stopHeartbeat();
				unsubscribe();
			});
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
			'Access-Control-Allow-Origin': '*',
			'Access-Control-Allow-Headers': 'Content-Type'
		}
	});
};
