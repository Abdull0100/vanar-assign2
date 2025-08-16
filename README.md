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

### 🗄️ Database & ORM

- **PostgreSQL** database with Docker containerization
- **Drizzle ORM** for type-safe database operations
- **Proper Schema Management** with migrations
- **Drizzle Studio** integration for database management

### 🔗 OAuth & Email Flows

- **Google OAuth** sign-in integration
- **GitHub OAuth** sign-in integration
- **Email Verification** during signup with secure tokens
- **Password Reset** via secure email links
- **SMTP Configuration** for transactional emails

### 🤖 AI Chat Interface

- **Vercel AI SDK** integration
- **Google Gemini API** for AI responses
- **Real-time Chat UI** with SvelteKit + TailwindCSS
- **Message History** with loading states and error handling
- **Responsive Design** for all devices

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

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# GitHub OAuth
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=your-email@gmail.com

# Gemini AI
GEMINI_API_KEY=your-gemini-api-key
```

### OAuth Setup

#### Google OAuth

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:5173/auth/callback/google`
   - `http://localhost:5174/auth/callback/google` (if port 5173 is busy)

#### GitHub OAuth

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL:
   - `http://localhost:5173/auth/callback/github`
   - `http://localhost:5174/auth/callback/github` (if port 5173 is busy)

### SMTP Setup (Gmail)

1. Enable 2-factor authentication on Gmail
2. Generate App Password
3. Use App Password in `SMTP_PASS`

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
│   └── chat/                # AI Chat interface
├── hooks.server.ts          # Server-side hooks
└── app.d.ts                 # TypeScript declarations
```

## 🔒 Security Features

- **Password Hashing** with bcryptjs
- **Secure Session Management** with database sessions
- **CSRF Protection** built into SvelteKit
- **Input Validation** and sanitization
- **Rate Limiting** on sensitive endpoints
- **Secure Email Tokens** with expiration
- **Role-Based Access Control**

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
- [ ] OAuth sign-in (Google & GitHub)
- [ ] Password reset flow
- [ ] Profile management
- [ ] Admin dashboard access
- [ ] AI chat functionality
- [ ] Protected route access
- [ ] Role-based permissions

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

---

**Happy Coding! 🚀**
