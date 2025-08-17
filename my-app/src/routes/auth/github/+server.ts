import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async () => {
  console.log('🔵 GitHub OAuth route hit: /auth/github');
  
  const clientId = import.meta.env.VITE_GITHUB_CLIENT_ID;
  const redirectUri = import.meta.env.VITE_GITHUB_REDIRECT_URI;
  const scope = 'user:email';

  if (!clientId || !redirectUri) {
    console.error('❌ Missing environment variables for GitHub OAuth');
    throw redirect(302, '/login?error=missing_env');
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&scope=${scope}`;

  console.log('🔗 Redirecting to GitHub OAuth:', githubAuthUrl);

  throw redirect(302, githubAuthUrl);
};
