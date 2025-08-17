# 🚀 Assignment 2: Full Auth.js Implementation + AI Chat Interface

A comprehensive authentication application built with **SvelteKit 5.0**, **Auth.js**, **PostgreSQL**, **Drizzle ORM**, and **Google Gemini AI**. This project implements all required features for Assignment 2 with production-ready code quality.

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

### 🔗 OAuth & Email Flows

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
cd haris
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

### Key Improvements Made
- **Accessibility**: WCAG compliant with proper ARIA roles and keyboard support
- **Email Functionality**: Robust verification and password reset system
- **Error Handling**: Beautiful custom error pages with production security
- **AI Chat**: Streaming responses with Vanar Chain branding
- **Profile Management**: Complete CRUD operations with modal dialogs
- **Admin Panel**: Full user management with role promotion emails

---

**Happy Coding! 🚀**
