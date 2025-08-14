import { signIn } from '$lib/auth';
import type { RequestHandler } from '@sveltejs/kit';

export const GET: RequestHandler = async (event): Promise<Response> => {
  const response = await signIn(event);
  if (!(response instanceof Response)) {
    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  return response;
};
