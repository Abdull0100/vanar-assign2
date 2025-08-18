# AI Chat Application

A modern web application built with SvelteKit, featuring AI-powered chat functionality using Google Gemini API.

## Features

- 🤖 **AI Chat Interface**: Powered by Google Gemini AI
- 🔐 **Authentication**: Complete auth system with email verification
- 📧 **Email Integration**: Support for Gmail, Outlook, Yahoo, and university emails
- 🎨 **Modern UI**: Built with TailwindCSS for responsive design
- ⚡ **Real-time Streaming**: Live chat responses with streaming
- 🛡️ **Type Safety**: Full TypeScript support

## AI Chat Setup

### 1. Get Google Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Copy the API key

### 2. Configure Environment Variables

Create a `.env` file in the root directory and add:

```env
API_KEY=your-gemini-api-key-here
```

### 3. Install Dependencies

```sh
pnpm install
```

### 4. Start Development Server

```sh
pnpm dev
```

### 5. Access Chat Interface

Navigate to `/chat` in your browser to use the AI chat interface.

## Chat Features

- **Real-time Streaming**: Responses stream in real-time as the AI generates them
- **Message History**: View conversation history with timestamps
- **Error Handling**: Graceful error display and recovery
- **Loading States**: Visual feedback during AI processing
- **Responsive Design**: Works on desktop and mobile devices
- **Keyboard Shortcuts**: Press Enter to send, Shift+Enter for new line

## API Endpoints

- `POST /api/chat` - Chat endpoint that accepts `{ messages }` and streams responses

## Tech Stack

- **Frontend**: SvelteKit + TypeScript + TailwindCSS
- **AI**: Google Gemini API via Vercel AI SDK
- **Styling**: TailwindCSS
- **Authentication**: SvelteKit Auth
- **Database**: PostgreSQL with Drizzle ORM

## Development

```sh
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Project Structure

```
src/
├── lib/
│   ├── components/
│   │   └── ChatInterface.svelte    # Main chat component
│   └── ...
├── routes/
│   ├── api/
│   │   └── chat/
│   │       └── +server.ts          # Chat API endpoint
│   └── chat/
│       └── +page.svelte            # Chat page
└── ...
```
