import type { Handle } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { handle as authHandle } from '$lib/server/auth/config';

// Custom handle function for security headers and improved error handling
const securityHandle: Handle = async ({ event, resolve }) => {
  try {
    // Add security headers
    const response = await resolve(event);
    
    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    // Add CSP header for better security
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;"
    );
    
    // Remove server information
    response.headers.delete('X-Powered-By');
    response.headers.delete('Server');
    
    return response;
    
  } catch (error) {
    console.error('Request handling error:', error);
    
    // Return a more informative error response in development
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    return new Response(
      isDevelopment ? `Internal Server Error: ${error}` : 'Internal Server Error',
      {
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY'
        }
      }
    );
  }
};

// Sequence Auth.js handle with custom security handle
export const handle = sequence(authHandle, securityHandle);
