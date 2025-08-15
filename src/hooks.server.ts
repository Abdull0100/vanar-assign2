import { handle as authHandle } from './lib/auth';
import { redirect, type Handle } from '@sveltejs/kit';

// Protected routes that require authentication
const protectedRoutes = [
  '/dashboard',
  '/admin',
  '/profile',
  '/chat'
];

// Admin-only routes
const adminRoutes = [
  '/admin'
];

export const handle: Handle = async ({ event, resolve }) => {
  // First, handle authentication
  const authResponse = await authHandle({ event, resolve });
  
  // Get the session from the event
  const session = await event.locals.getSession?.();
  
  // Check if user is trying to access protected routes
  const pathname = event.url.pathname;
  
  if (protectedRoutes.some(route => pathname.startsWith(route))) {
    if (!session?.user) {
      // Redirect to sign-in if not authenticated
      throw redirect(303, '/auth/signin');
    }
    
    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route))) {
      if (session.user.role !== 'admin') {
        // Redirect to dashboard if not admin
        throw redirect(303, '/dashboard');
      }
    }
  }
  
  // Continue with the request
  return authResponse;
};
