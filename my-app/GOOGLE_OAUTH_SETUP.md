# Google OAuth Setup Guide

## 1. Create Environment Variables

Create a `.env` file in your `my-app` directory with the following content:

```env
# Google OAuth Credentials
# Get these from https://console.cloud.google.com/apis/credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here

# Auth.js Secret (generate with: openssl rand -base64 32)
AUTH_SECRET=your_auth_secret_here
```

## 2. Generate Auth Secret

Run this command to generate a secure secret:

```bash
openssl rand -base64 32
```

Copy the output and paste it as your `AUTH_SECRET`.

## 3. Set up Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
2. Create a new project or select an existing one
3. Enable the Google+ API (or Google Identity API)
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client IDs"
5. Set application type to "Web application"
6. Add authorized redirect URI: `http://localhost:5173/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env` file

## 4. Update Database Schema

Run the database migration to apply the OAuth schema changes:

```bash
npm run db:push
```

## 5. Restart Your Development Server

After setting up the environment variables, restart your dev server:

```bash
npm run dev
```

## 6. Test Google Sign-in

1. Go to `http://localhost:5173/login` or `http://localhost:5173/signup`
2. Click "Continue with Google"
3. Complete the OAuth flow
4. You should be redirected back and logged in!

## Troubleshooting

- Make sure all environment variables are set correctly
- Check that the redirect URI matches exactly: `http://localhost:5173/auth/callback/google`
- Ensure the Google+ API is enabled in your Google Cloud project
- Check the browser console and server logs for any errors
