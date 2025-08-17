# GitHub OAuth Setup Guide

## 1. Create Environment Variables

Add the following variables to your `.env` file in the `my-app` directory:

```env
# GitHub OAuth Credentials
VITE_GITHUB_CLIENT_ID=your_github_client_id_here
VITE_GITHUB_REDIRECT_URI=http://localhost:5173/auth/github/callback
```

## 2. Set up GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click "New OAuth App"
3. Fill in the application details:
   - **Application name**: Your app name (e.g., "My App")
   - **Homepage URL**: `http://localhost:5173`
   - **Application description**: Brief description of your app
   - **Authorization callback URL**: `http://localhost:5173/auth/github/callback`
4. Click "Register application"
5. Copy the **Client ID** to your `.env` file

## 3. Create GitHub OAuth Callback Route

You'll need to create a server-side route to handle the GitHub OAuth callback. Create the following file:

```typescript
// src/routes/auth/github/callback/+server.ts
import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url, cookies }) => {
  const code = url.searchParams.get('code');
  
  if (!code) {
    throw redirect(302, '/login?error=no_code');
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: import.meta.env.VITE_GITHUB_CLIENT_ID,
        client_secret: import.meta.env.GITHUB_CLIENT_SECRET, // Server-side only
        code: code,
        redirect_uri: import.meta.env.VITE_GITHUB_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw redirect(302, `/login?error=${tokenData.error}`);
    }

    // Get user information
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const userData = await userResponse.json();
    
    // Get user email
    const emailResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    });

    const emails = await emailResponse.json();
    const primaryEmail = emails.find((email: any) => email.primary)?.email;

    // TODO: Create or update user in your database
    // TODO: Set session/token in cookies
    
    throw redirect(302, '/');
    
  } catch (error) {
    console.error('GitHub OAuth error:', error);
    throw redirect(302, '/login?error=oauth_error');
  }
};
```

## 4. Add Server-side Environment Variables

Add the GitHub client secret to your server-side environment variables (not exposed to the client):

```env
# Server-side only (not VITE_ prefixed)
GITHUB_CLIENT_SECRET=your_github_client_secret_here
```

## 5. Update Database Schema (if needed)

If you need to store GitHub-specific user data, update your database schema accordingly.

## 6. Restart Your Development Server

After setting up the environment variables, restart your dev server:

```bash
npm run dev
```

## 7. Test GitHub Sign-in

1. Go to `http://localhost:5173/login` or `http://localhost:5173/signup`
2. Click "Continue with GitHub"
3. Complete the OAuth flow
4. You should be redirected back and logged in!

## Troubleshooting

- Make sure all environment variables are set correctly
- Check that the redirect URI matches exactly: `http://localhost:5173/auth/github/callback`
- Ensure your GitHub OAuth app is properly configured
- Check the browser console and server logs for any errors
- Make sure the GitHub client secret is only used server-side (not prefixed with VITE_)

## Security Notes

- Never expose `GITHUB_CLIENT_SECRET` to the client-side
- Always validate the OAuth callback on the server-side
- Use HTTPS in production
- Implement proper session management
- Consider rate limiting for OAuth endpoints
