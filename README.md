# 🚀 Assignment 2: Full Auth.js Implementation + AI Chat Interface

A comprehensive authentication application built with **SvelteKit 5.0**, **Auth.js**, **PostgreSQL**, **Drizzle ORM**, and **Google Gemini AI**. This project implements all required features for Assignment 2 with production-ready code quality and comprehensive testing.

## ✨ Features Implemented

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

- **PostgreSQL** database with Docker containerization
- **Drizzle ORM** for type-safe database operations
- **Proper Schema Management** with migrations
- **Drizzle Studio** integration for database management
- **Chat Schema Restructuring** with room-based architecture

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

- **Vercel AI SDK** integration
- **Google Gemini API** for AI responses
- **Real-time Chat UI** with SvelteKit + TailwindCSS
- **Message History** with loading states and error handling
- **Responsive Design** for all devices
- **Streaming AI Responses** for real-time interaction
- **Vanar Chain Branding** with company-specific AI personality
- **Custom System Instructions** for specialized responses
- **Room-based Chat Architecture** with conversation management

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
- **Backend**: SvelteKit API routes
- **Authentication**: Auth.js (@auth/sveltekit)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini API + Vercel AI SDK
- **Email**: Nodemailer with SMTP
- **Styling**: TailwindCSS with responsive design
- **Testing**: Vitest + Playwright
- **CI/CD**: GitHub Actions
- **Containerization**: Docker + Docker Compose

## 📋 Prerequisites

- **Node.js** 18+ and **pnpm** 8+
- **Docker** and **Docker Compose**
- **PostgreSQL** (via Docker)
- **Google Cloud Console** account (for OAuth)
- **GitHub Developer Settings** (for OAuth)
- **Gmail App Password** or SMTP service
- **Google Gemini API Key**

## 🚀 Quick Start

### 1. Clone & Setup

```bash
git clone <your-repo-url>
cd 18-08
pnpm install
```

### 2. Environment Configuration

```bash
cp .env.example .env
# Fill in your environment variables (see Configuration section)
```

### 3. Start Database

```bash
pnpm run db:start
# Wait 10-15 seconds for PostgreSQL to initialize
```

### 4. Setup Database

```bash
pnpm run db:push      # Push schema to database
pnpm run db:seed      # Seed with test users
```

### 5. Start Development Server

```bash
pnpm run dev
pnpm run dev --open
```

Visit **http://localhost:5173** to see your application!

## ⚙️ Configuration

### Environment Variables (.env)

```ini
# Auth.js Configuration
AUTH_SECRET=your-super-secret-key-here-change-this-in-production
AUTH_TRUST_HOST=true

# Database
DATABASE_URL=postgresql://postgres:123@localhost:5433/local

# Email Configuration (Gmail)
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
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
   - `http://localhost:5173/auth/callback/google`
   - `http://localhost:5173/auth/callback/google/`

#### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:5173/auth/callback/github`

## 📚 Available Scripts

```bash
# Development
pnpm run dev              # Start development server
pnpm run build            # Build for production
pnpm run preview          # Preview production build

# Database
pnpm run db:start         # Start PostgreSQL container
pnpm run db:push          # Push schema to database
pnpm run db:generate      # Generate migrations
pnpm run db:migrate       # Run migrations
pnpm run db:studio        # Open Drizzle Studio
pnpm run db:seed          # Seed database with test users

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
│   │   └── schema.ts        # Database schema
│   ├── email.ts             # Email utilities
│   ├── errors.ts            # Custom error classes and utilities
│   └── server/              # Server-side utilities
├── routes/
│   ├── api/                 # API endpoints
│   │   ├── auth/            # Authentication APIs
│   │   ├── admin/           # Admin APIs
│   │   ├── profile/         # Profile APIs
│   │   └── chat/            # AI Chat API
│   ├── auth/                # Authentication pages
│   ├── dashboard/           # User dashboard
│   ├── admin/               # Admin dashboard
│   ├── profile/             # User profile
│   ├── chat/                # AI Chat interface
│   ├── test-error/          # Error testing page
│   ├── +error.svelte        # Custom error page
│   ├── +layout.svelte       # Global layout
│   └── +layout.server.ts    # Layout server load
├── hooks.server.ts          # Server-side hooks & error handling
├── hooks.client.ts          # Client-side error handling
└── app.d.ts                 # TypeScript declarations
```

## 🗄️ Database Schema

### Chat System Architecture

The chat system uses a **room-based architecture** where:

- **`conversations`** table represents chat rooms with `roomName`
- **`chatMessages`** table stores individual messages with:
  - `content`: User query or empty string for AI
  - `sender`: 'user' or 'ai' identification
  - `aiResponse`: AI response text (null for user messages)
  - `conversationId`: Links message to specific room

### Key Design Principles

1. **No Message Grouping**: Each message is stored separately
2. **Room-Based Structure**: `conversationId` represents a chat room
3. **Explicit Sender Identification**: Clear 'user' or 'ai' designation
4. **Optional AI Responses**: `aiResponse` field can be null
5. **Empty Room Filtering**: Rooms with no messages are automatically hidden

### Database Relationships

```
users (1) ←→ (many) conversations
users (1) ←→ (many) chatMessages
conversations (1) ←→ (many) chatMessages
```

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

## 🎯 Assignment 2 Requirements Met

### ✅ Core Features
- [x] **Auth.js Integration** - Complete authentication system
- [x] **Database Sessions** - PostgreSQL-based sessions (no JWT)
- [x] **Protected Routes** - Role-based access control
- [x] **Profile Management** - Full CRUD operations
- [x] **Admin Dashboard** - User management and analytics
- [x] **Email Verification** - Secure token system
- [x] **Password Reset** - Secure email-based reset
- [x] **OAuth Integration** - Google and GitHub support

### ✅ Technical Requirements
- [x] **SvelteKit 5.0** - Modern framework implementation
- [x] **PostgreSQL** - Production-ready database
- [x] **Drizzle ORM** - Type-safe database operations
- [x] **TypeScript** - Full type safety
- [x] **Error Handling** - Comprehensive error management
- [x] **Testing** - Unit and E2E test coverage
- [x] **Documentation** - Complete setup and usage guides

### ✅ Bonus Features
- [x] **AI Chat Interface** - Google Gemini integration
- [x] **Streaming Responses** - Real-time AI interaction
- [x] **Responsive Design** - Mobile-first approach
- [x] **Accessibility** - WCAG compliance
- [x] **Docker Support** - Easy development setup
- [x] **Production Ready** - Deployment configuration

## 🚀 Getting Started for Reviewers

### Quick Validation

1. **Clone Repository**: Fresh clone should work without issues
2. **Environment Setup**: Copy `.env.example` and configure variables
3. **Database Start**: `pnpm run db:start` (wait 10-15 seconds)
4. **Schema Setup**: `pnpm run db:push && pnpm run db:seed`
5. **Start Application**: `pnpm run dev`
6. **Test Accounts**: Use provided test credentials

### Key Test Scenarios

1. **Authentication Flow**: Signup → Verification → Login
2. **OAuth Integration**: Google and GitHub sign-in
3. **Admin Access**: Login as admin and manage users
4. **AI Chat**: Send messages and receive streaming responses
5. **Error Handling**: Test various error scenarios
6. **Accessibility**: Keyboard navigation and screen reader support

---

## 🎉 Project Status: COMPLETE ✅

**Assignment 2 is fully implemented with all required features working correctly. The application is production-ready with comprehensive testing, documentation, and professional code quality.**

**Happy Coding! 🚀**
