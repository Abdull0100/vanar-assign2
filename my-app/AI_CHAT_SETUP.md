# AI Chat Setup Guide

## Quick Setup

### 1. Install Dependencies
```bash
pnpm install
```

### 2. Get Google Gemini API Key
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key

### 3. Configure Environment Variables
Create a `.env` file in the root directory (if it doesn't exist) and add:
```env
API_KEY=your-gemini-api-key-here
```

### 4. Start the Development Server
```bash
pnpm dev
```

### 5. Access the Chat Interface
Navigate to `/chat` in your browser

## Features

- **Real-time Streaming**: Responses appear as the AI generates them
- **Conversation History**: View all messages with timestamps
- **Error Handling**: Graceful error display and recovery
- **Loading States**: Visual feedback during AI processing
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Press Enter to send, Shift+Enter for new line

## Troubleshooting

### "Cannot find module '@ai-sdk/google'"
Run: `pnpm install`

### "API key not configured"
Add your Gemini API key to the `.env` file

### "AI service temporarily unavailable"
Make sure you've installed dependencies and configured the API key

## Demo Mode

If the API key is not configured, the chat will run in demo mode with helpful setup instructions.

## API Endpoints

- `POST /api/chat` - Chat endpoint that accepts `{ messages }` and streams responses

## Tech Stack

- **Frontend**: SvelteKit + TypeScript + TailwindCSS
- **AI**: Google Gemini API via Vercel AI SDK
- **Streaming**: Real-time response streaming
- **Styling**: TailwindCSS for responsive design
