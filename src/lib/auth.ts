import { env } from '$env/dynamic/private';

// Google OAuth configuration
export const GOOGLE_CLIENT_ID = env.GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = env.GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
export const GOOGLE_USER_INFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';

// GitHub OAuth configuration
export const GITHUB_CLIENT_ID = env.GITHUB_CLIENT_ID || '';
export const GITHUB_CLIENT_SECRET = env.GITHUB_CLIENT_SECRET || '';
export const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';
export const GITHUB_USER_INFO_URL = 'https://api.github.com/user';

// Generate OAuth URLs
export function getGoogleAuthUrl(): string {
  const baseUrl = env.BASE_URL || 'http://localhost:5173';
  const redirectUri = `${baseUrl}/auth/google/callback`;
  
  const params = new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'consent'
  });
  
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export function getGitHubAuthUrl(): string {
  const baseUrl = env.BASE_URL || 'http://localhost:5173';
  const redirectUri = `${baseUrl}/auth/github/callback`;
  
  const params = new URLSearchParams({
    client_id: GITHUB_CLIENT_ID,
    redirect_uri: redirectUri,
    scope: 'user:email',
    state: Math.random().toString(36).substring(2, 15)
  });
  
  return `https://github.com/login/oauth/authorize?${params.toString()}`;
}

// Re-export Auth.js components for consistent access
export { handle, signIn, signOut } from '$lib/server/auth/config';