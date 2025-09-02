# 🚀 Assignment 3: RAG Backend with pgvector + Production UI

A comprehensive Retrieval-Augmented Generation (RAG) application built with **SvelteKit 5.0**, **Auth.js**, **pgvector**, **Python Embedding Service**, and **Google Gemini AI**. This project extends Assignment 2 with advanced RAG capabilities, document ingestion, and context-aware AI responses with production-ready code quality.

## ✨ Features Implemented

### 🧠 RAG Backend with pgvector

- **pgvector Integration** with vector similarity search
- **Document Ingestion** supporting text files and PDFs
- **Chunking Strategy** with configurable chunk sizes and overlap
- **Embedding Storage** with metadata tracking
- **Context Retrieval** for relevant document snippets
- **Citation System** showing source documents and chunks
- **Vector Similarity Search** with configurable similarity thresholds

### 🐍 Python Embedding Service

- **Containerized Microservice** with Docker support
- **FastAPI Backend** for embedding generation
- **Multiple Model Support** (OpenAI, Sentence Transformers)
- **Health Check Endpoints** for service monitoring
- **Environment-based Configuration** with clean integration
- **Error Handling** with proper HTTP status codes
- **Scalable Architecture** ready for production deployment

### 🔐 Authentication & Authorization

- **Auth.js Integration** with email + password authentication
- **Database Sessions** (PostgreSQL) - No JWT tokens
- **Protected Routes** for dashboard, profile, admin, and chat
- **Role-Based Access Control** (Admin vs User roles)
- **Profile Management** with view & update capabilities
- **Admin Dashboard** with user management and analytics
- **Email Verification** with secure token system
- **Password Reset** via secure email links
- **Admin Promotion** with congratulatory emails

### 🗄️ Database & ORM

- **pgvector-enabled PostgreSQL** with vector similarity search
- **Drizzle ORM** for type-safe database operations
- **Vector Schema** with documents, chunks, and embeddings tables
- **Proper Schema Management** with migrations
- **Drizzle Studio** integration for database management
- **Tree-structured Chat History** with branching and forking
- **Document Metadata** tracking with timestamps and user associations

### 🔗 OAuth & Email Flows

- **Google OAuth** integration with proper callback handling
- **GitHub OAuth** integration with secure authentication
- **Email Verification** during signup with secure tokens
- **Password Reset** via secure email links
- **Admin Promotion** congratulatory emails
- **SMTP Configuration** for transactional emails
- **Custom Email Templates** with HTML formatting
- **Secure Token Generation** with crypto module

### 🤖 AI Chat Interface

- **Vercel AI SDK** integration with context-aware responses
- **Google Gemini API** for AI responses with RAG context
- **Real-time Chat UI** with SvelteKit + TailwindCSS
- **Streaming AI Responses** with context integration
- **Tree-structured Chat History** with branching and forking
- **Message Persistence** with database storage
- **Citation Display** showing source documents and chunks
- **Markdown Rendering** with syntax highlighting (Prism.js)
- **Code Block Support** with copy-to-clipboard functionality
- **Responsive Design** for all devices
- **Vanar Chain Branding** with company-specific AI personality

### 🚨 Error Handling System

- **Beautiful Custom Error Pages** for all HTTP errors (404, 403, 500, etc.)
- **Graceful Error Handling** with user-friendly messages
- **Developer-Friendly Debugging** in development mode
- **Secure Error Reporting** (no sensitive data exposure in production)
- **Custom Error Classes** for different error types
- **Comprehensive Error Logging** and tracking
- **Custom Error Page** with user-friendly messaging
- **Production Error Masking** for security

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5.0 + TailwindCSS 4.0
- **Backend**: SvelteKit API routes + Python FastAPI
- **Authentication**: Auth.js (@auth/sveltekit)
- **Database**: pgvector-enabled PostgreSQL + Drizzle ORM
- **Vector Search**: pgvector with similarity search
- **AI**: Google Gemini API + Vercel AI SDK
- **Embeddings**: Python service with OpenAI/Sentence Transformers
- **Document Processing**: PDF parsing and text chunking
- **Email**: Nodemailer with SMTP
- **Styling**: TailwindCSS with responsive design
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose

## 📋 Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Python** 3.9+ (for embedding service)
- **Docker** and **Docker Compose**
- **pgvector-enabled PostgreSQL** (via Docker)
- **Google Cloud Console** account (for OAuth)
- **GitHub Developer Settings** (for OAuth)
- **Gmail App Password** or SMTP service
- **Google Gemini API Key**
- **OpenAI API Key** (for embeddings) or Sentence Transformers

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone (https://github.com/Abdull0100/vanar-assign2)
cd 18-08
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Fill in your environment variables (see Configuration section)
```

### 3. Start Services

```bash
# Start pgvector database and Python embedding service
docker-compose up -d

# Wait 10-15 seconds for services to initialize
docker-compose logs -f
```

### 4. Setup Database

```bash
pnpm run db:migrate   # Run database migrations
pnpm run db:seed      # Seed with test users (optional)
```

### 5. Start Development Server

```bash
pnpm install
pnpm run dev
pnpm run dev --open
```

Visit **http://localhost:5173** to see your application!

### 6. Health Check

```bash
# Check service health
curl http://localhost:5173/healthz
curl http://localhost:5173/version
curl http://localhost:8000/health  # Python embedding service
```

## ⚙️ Configuration

### Environment Variables (.env)

```ini
# Auth.js Configuration
AUTH_SECRET=your-super-secret-key-here-change-this-in-production
AUTH_TRUST_HOST=true

# Database (pgvector-enabled PostgreSQL)
DATABASE_URL=postgresql://postgres:123@localhost:5433/local

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# AI Services
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key

# Embedding Service
EMBEDDING_API_URL=http://localhost:8000
EMBEDDING_MODEL=text-embedding-3-small

# RAG Configuration
CHUNK_SIZE=1000
CHUNK_OVERLAP=200
SIMILARITY_THRESHOLD=0.7
MAX_CONTEXT_CHUNKS=5
```

### Email Setup (Gmail)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate password for "Mail"
3. **Use App Password** in `GMAIL_APP_PASSWORD` (not your regular password)

### OAuth Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/api/auth/callback/google`
   - `http://localhost:5173/api/auth/callback/google/`

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:5173/api/auth/callback/github`

## 📚 Available Scripts

```bash
# Development
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run preview          # Preview production build

# Database & Services
pnpm run db:start         # Start PostgreSQL container
pnpm run db:push          # Push schema to database
pnpm run db:generate      # Generate migrations
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Drizzle Studio
pnpm run db:seed          # Seed database with test users
docker-compose up -d      # Start all services (DB + embedding service)
docker-compose down       # Stop all services

# RAG & Document Processing
pnpm run ingest:docs      # Ingest documents from uploads folder
pnpm run embed:test       # Test embedding service connection
pnpm run rag:test         # Test RAG retrieval functionality

# Code Quality
pnpm run check            # Type checking
pnpm run lint             # Lint code
pnpm run format           # Format code

# Testing
pnpm run test             # Run all tests
pnpm run test:unit        # Run unit tests
pnpm run test:e2e         # Run E2E tests
```

## 🧪 Testing Accounts

After running the seed script, you'll have these test accounts:

### Admin User

- **Email**: `admin@example.com`
- **Password**: `admin123`
- **Role**: Admin (full access to all features)

### Regular Users

- **Email**: `user@example.com`
- **Password**: `user123`
- **Role**: User (standard access)

- **Email**: `john@example.com`
- **Password**: `user123`
- **Role**: User (standard access)

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── auth.ts              # Auth.js configuration
│   ├── db/                  # Database configuration
│   │   ├── index.ts         # Database connection
│   │   └── schema.ts        # Database schema (includes vector tables)
│   ├── email.ts             # Email utilities
│   ├── errors.ts            # Custom error classes and utilities
│   ├── rag/                 # RAG functionality
│   │   ├── embeddings.ts    # Embedding service integration
│   │   ├── retrieval.ts     # Vector similarity search
│   │   ├── chunking.ts      # Document chunking utilities
│   │   └── citations.ts     # Citation management
│   └── server/              # Server-side utilities
├── routes/
│   ├── api/                 # API endpoints
│   │   ├── auth/            # Authentication APIs
│   │   ├── admin/           # Admin APIs
│   │   ├── profile/         # Profile APIs
│   │   ├── chat/            # AI Chat API with RAG
│   │   ├── documents/       # Document upload & management
│   │   └── embeddings/      # Embedding service proxy
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── admin/               # Admin dashboard
│   ├── profile/             # User profile
│   ├── chat/                # AI Chat interface with citations
│   ├── documents/           # Document management interface
│   ├── test-error/          # Error testing page
│   ├── +error.svelte        # Custom error page
│   ├── +layout.svelte       # Global layout
│   └── +layout.server.ts    # Layout server load
├── embed-api/               # Python embedding service
│   ├── main.py              # FastAPI application
│   ├── models.py            # Embedding models
│   ├── requirements.txt     # Python dependencies
│   └── Dockerfile           # Container configuration
├── uploads/                 # Document upload directory
├── hooks.server.ts          # Server-side hooks & error handling
├── hooks.client.ts          # Client-side error handling
└── app.d.ts                 # TypeScript declarations
```

## 🗄️ Database Schema

### RAG System Architecture

The system uses **pgvector** for semantic search with the following tables:

- **`documents`** - Stores uploaded documents with metadata
- **`chunks`** - Text chunks from documents with references
- **`embeddings`** - Vector embeddings linked to chunks
- **`conversations`** - Chat conversations with tree structure
- **`chatMessages`** - Individual messages with parent/child relationships

### Vector Schema Design

```sql
-- Documents table
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  content_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Chunks table
CREATE TABLE chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  chunk_index INTEGER,
  start_position INTEGER,
  end_position INTEGER
);

-- Embeddings table with pgvector
CREATE TABLE embeddings (
  id UUID PRIMARY KEY,
  chunk_id UUID REFERENCES chunks(id),
  embedding VECTOR(1536), -- OpenAI embedding dimension
  model_name TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Tree-structured chat messages
CREATE TABLE chatMessages (
  id UUID PRIMARY KEY,
  parent_id UUID REFERENCES chatMessages(id),
  conversation_id UUID REFERENCES conversations(id),
  content TEXT,
  role TEXT CHECK (role IN ('user', 'assistant')),
  citations JSONB, -- Store citation references
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Key Design Principles

1. **Vector Similarity Search**: pgvector enables semantic document retrieval
2. **Tree Structure**: Messages support branching and forking
3. **Citation Tracking**: Each AI response includes source document references
4. **Chunk-based Processing**: Documents are split into manageable chunks
5. **Metadata Preservation**: Full document and chunk metadata tracking

## 🔄 RAG Workflow

### Document Ingestion Process

1. **Upload**: Users upload text files or PDFs through the web interface
2. **Parsing**: Documents are parsed to extract text content
3. **Chunking**: Text is split into overlapping chunks (configurable size)
4. **Embedding**: Each chunk is sent to Python service for vector embedding
5. **Storage**: Embeddings stored in pgvector with metadata links
6. **Indexing**: Vector similarity search enabled for retrieval

### Chat with RAG

1. **Query Processing**: User message is sent to embedding service
2. **Vector Search**: Similar chunks retrieved from pgvector database
3. **Context Assembly**: Relevant chunks combined with user query
4. **AI Generation**: Gemini API generates response with context
5. **Citation Tracking**: Source documents and chunks recorded
6. **Response Display**: AI response shown with citation references

### Tree-structured Chat History

- **Branch Creation**: Edit user message → new branch from that point
- **Regeneration**: Regenerate AI response → new branch from AI turn
- **Navigation**: Switch between branches using UI controls
- **Persistence**: All branches stored with parent/child relationships

## ♿ Accessibility Features

- **Full ARIA Support** with proper roles and labels
- **Keyboard Navigation** for all interactive elements
- **Screen Reader Compatibility** with semantic HTML
- **Focus Management** for modal dialogs
- **Keyboard Event Handlers** for all click events
- **WCAG Compliance** with accessibility best practices
- **Semantic HTML Structure** for better navigation
- **Color Contrast** optimized for readability

## 🔒 Security Features

- **Password Hashing** with bcryptjs
- **Secure Session Management** with database sessions
- **CSRF Protection** built into SvelteKit
- **Input Validation** and sanitization
- **Rate Limiting** on sensitive endpoints
- **Secure Email Tokens** with expiration
- **Role-Based Access Control**
- **Custom Error Handling** with secure error messages
- **Production Error Masking** (no sensitive data leaks)
- **OAuth Security** with proper callback handling

## 🚀 Deployment

### Production Build

```bash
pnpm run build
pnpm run preview
```

### Environment Variables

- Set all required environment variables
- Use strong `AUTH_SECRET`
- Configure production database URL
- Set up production SMTP service
- Configure production OAuth redirect URIs

## 🧪 Testing

### Unit Tests

```bash
pnpm run test:unit
```

### E2E Tests

```bash
pnpm run test:e2e
```

### Manual Testing Checklist

- [ ] User registration and email verification
- [ ] User login with credentials
- [ ] Password reset flow
- [ ] Profile management (view, update, change password, delete account)
- [ ] Admin dashboard access and user management
- [ ] AI chat functionality with streaming responses
- [ ] Protected route access and role-based permissions
- [ ] Error pages and custom error handling
- [ ] Accessibility features (keyboard navigation, screen reader support)
- [ ] Email functionality (verification, password reset, admin promotion)
- [ ] OAuth flows (Google and GitHub)
- [ ] Chat room management and message persistence

## 🌿 Git Branching Strategy

### Branch Naming Convention

- `main` - Production-ready code (protected)
- `develop` - Integration branch for features
- `feature/description` - Feature development branches
- `fix/description` - Bug fix branches
- `hotfix/description` - Critical fixes

### Workflow

1. **Feature Development**: Create feature branch from `develop`
2. **Code Review**: Pull request with peer review required
3. **Integration**: Merge to `develop` after approval
4. **Release**: Merge `develop` to `main` for releases

### Commit Convention

Use **Conventional Commits** format:

```bash
git commit -m "feat: implement OAuth Google sign-in"
git commit -m "fix: resolve database connection timeout"
git commit -m "docs: update README with setup instructions"
git commit -m "refactor: optimize database queries"
```

## 🎤 Presentation Outline

### Demo Flow (10 minutes total)

1. **Project Overview** (1 min) - Tech stack and achievements
2. **Live Demo - Core Features** (6 min):
   - Authentication & Authorization (2 min)
   - Database & ORM (1 min)
   - OAuth & Email Flows (1.5 min)
   - AI Chat Interface (1.5 min)
3. **Technical Implementation** (2 min) - Architecture and security
4. **Key Challenges & Solutions** (1 min) - Problem-solving approach

### Key Demo Points

- Complete feature implementation
- Production-ready code quality
- Comprehensive error handling
- Responsive and accessible UI
- Real-time AI chat with streaming
- Secure authentication system

## 🐛 Troubleshooting

### Common Issues

#### Database Connection Failed

```bash
# Check if Docker is running
docker compose ps

# Restart database
docker compose down -v
docker compose up -d

# Wait for PostgreSQL to start
docker compose logs db
```

#### Port Already in Use

```bash
# Change port in docker-compose.yml
ports:
  - 5434:5432  # Use different host port
```

#### OAuth Errors

- Verify OAuth credentials in `.env`
- Check redirect URIs match exactly
- Ensure OAuth apps are properly configured

#### Email Not Sending

- Verify SMTP credentials
- Check Gmail App Password setup
- Ensure `SMTP_FROM` matches `SMTP_USER`

#### Error Pages Not Showing

- Check that `+error.svelte` exists in `src/routes/`
- Verify `hooks.server.ts` and `hooks.client.ts` are configured
- Test error pages at `/test-error?type=404` or `/test-error?type=500`

### Development Tips

- Use `pnpm run db:studio` to inspect database
- Check browser console for client errors
- Monitor server logs for backend issues
- Use `pnpm run check` for TypeScript errors

## 📖 API Documentation

### Authentication Endpoints

- `POST /api/auth/signup` - User registration
- `POST /api/auth/verify` - Email verification
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset

### User Management

- `GET /api/profile` - Get user profile
- `PATCH /api/profile` - Update user profile
- `GET /api/admin/users` - Get all users (admin only)
- `PATCH /api/admin/users/[id]/role` - Change user role (admin only)

### AI Chat

- `POST /api/chat` - Send message to AI
- `GET /api/chat` - Get chat history
- `PUT /api/chat` - Update conversation
- `DELETE /api/chat` - Delete messages/conversations

## 🤝 Contributing

1. **Branch Strategy**: Use `feature/description` branches
2. **Pull Requests**: Open PRs to main with peer review
3. **Commit Convention**: Use Conventional Commits
4. **Code Quality**: Ensure all tests pass before merging

## 📄 License

This project is created for Assignment 2 purposes.

## 🆘 Support

If you encounter issues:

1. Check the troubleshooting section
2. Review error logs
3. Verify environment configuration
4. Ask for help on Slack

## 🆕 Recent Updates & Improvements

### Latest Fixes (Latest Session)

- ✅ **Accessibility Compliance**: Full ARIA support and keyboard navigation
- ✅ **Profile Page**: Fixed modal interactions and form handling
- ✅ **Email System**: Streamlined Gmail configuration
- ✅ **Error Handling**: Resolved all linter warnings and TypeScript errors
- ✅ **Code Quality**: Clean, maintainable code with proper accessibility
- ✅ **User Experience**: Smooth interactions and responsive design
- ✅ **Chat Schema**: Restructured for room-based architecture
- ✅ **Empty Room Filtering**: Automatic removal of conversations with no messages

### Key Improvements Made

- **Accessibility**: WCAG compliant with proper ARIA roles and keyboard support
- **Email Functionality**: Robust verification and password reset system
- **Error Handling**: Beautiful custom error pages with production security
- **AI Chat**: Streaming responses with Vanar Chain branding
- **Profile Management**: Complete CRUD operations with modal dialogs
- **Admin Panel**: Full user management with role promotion emails
- **Chat Architecture**: Room-based system with proper message separation
- **Data Integrity**: Automatic cleanup of empty conversations

## 🎯 Assignment 3 Requirements Met

### ✅ RAG Backend with pgvector

- [x] **pgvector Integration** - Vector similarity search enabled
- [x] **Document Schema** - Tables for documents, chunks, and embeddings
- [x] **Text File Ingestion** - Parse, chunk, embed, and store functionality
- [x] **Vector Retrieval** - Query embeddings and pass context to AI
- [x] **Citation System** - Show source documents and chunks

### ✅ Python Embedding Service

- [x] **Containerized Microservice** - Docker-based Python service
- [x] **FastAPI Backend** - Clean API for embedding generation
- [x] **Environment Integration** - EMBEDDING_API_URL configuration
- [x] **Health Monitoring** - Service health check endpoints

### ✅ AI Chat Integration

- [x] **Context-aware Chat** - Messages incorporate retrieved context
- [x] **Citation Display** - Show document/chunk sources
- [x] **Markdown Rendering** - Rich text and code fence support
- [x] **Syntax Highlighting** - Prism.js code block highlighting
- [x] **Streaming Responses** - Real-time AI interaction
- [x] **Tree-structured History** - Branching and forking support

### ✅ Assignment 2 Extensions (Now Required)

- [x] **Streaming Chat UI** - Real-time response streaming
- [x] **Database Chat Storage** - Persistent conversation history
- [x] **Tree-structured Forks** - Edit/regenerate creates branches
- [x] **Branch Navigation** - Switch between conversation branches
- [x] **Parent/Child Relations** - Proper message hierarchy

### ✅ Auth & Platform

- [x] **Auth.js Integration** - Email/password with database sessions
- [x] **RBAC System** - Admin dashboard and role management
- [x] **OAuth Support** - Google and GitHub integration
- [x] **Email Flows** - Verification and password reset
- [x] **Vercel AI SDK** - Gemini API integration

### ✅ UI/UX Requirements

- [x] **Clean Design** - Tailwind with consistent spacing
- [x] **Chat Polish** - Message bubbles, timestamps, streaming cursor
- [x] **History Panel** - Tree view with search/filter
- [x] **Markdown Support** - Syntax highlighting in messages
- [x] **Accessibility** - Keyboard navigation and ARIA labels

## 🚀 Getting Started for Reviewers

### Fresh-Clone Validation (Required)

1. **Clone Repository**: `git clone <repo-url> && cd <repo-name>`
2. **Environment Setup**: `cp .env.example .env` and configure secrets
3. **Start Services**: `docker-compose up -d` (pgvector DB + embed-api)
4. **Install Dependencies**: `pnpm install`
5. **Database Setup**: `pnpm run db:migrate` (optional: `pnpm run db:seed`)
6. **Start Application**: `pnpm run dev`
7. **Health Check**: Visit `/healthz`, `/version`, and test embedding service

### Key Test Scenarios

1. **RAG Architecture**: Upload documents and test retrieval
2. **Python Embedding Service**: Verify service health and functionality
3. **Context-aware Chat**: Ask questions and verify citations
4. **Tree-structured History**: Test branching and forking
5. **Markdown Rendering**: Verify code highlighting and formatting
6. **Authentication Flow**: Complete auth system with OAuth
7. **Document Ingestion**: Upload text files and PDFs (if extension completed)

### Success Criteria Validation

- [ ] pgvector container running in Docker Compose
- [ ] Python embedding service integrated and responding
- [ ] Text file ingestion working with chunking and embedding
- [ ] Context-grounded answers with citations displayed
- [ ] Streaming responses with tree-structured chat history
- [ ] Markdown + syntax highlighting in chat messages
- [ ] Fresh-clone validation passes without manual steps

---

## 🎉 Project Status: ASSIGNMENT 3 READY ✅

**Assignment 3 is fully implemented with RAG backend, pgvector integration, Python embedding service, and production-quality UI. The application supports document ingestion, context-aware AI responses, and tree-structured chat history with comprehensive testing and documentation.**

**Ready for Production! 🚀**
