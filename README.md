# Auth App - Full Authentication & AI Chat

A complete authentication system built with SvelteKit, Auth.js, PostgreSQL, and Drizzle ORM, featuring OAuth providers, email verification, and an AI-powered chat interface using Google Gemini.

## 🚀 Features

- **Authentication & Authorization**
  - Email/password authentication
  - Google OAuth integration
  - GitHub OAuth integration
  - Email verification system
  - Password reset functionality
  - Role-based access control (User/Admin)

- **Database & ORM**
  - PostgreSQL database
  - Drizzle ORM for type-safe queries
  - User management system
  - Session management

- **AI Chat Interface**
  - Google Gemini AI integration
  - Real-time chat functionality
  - Chat history storage
  - User-specific conversations

- **Admin Dashboard**
  - User management
  - Role management
  - System analytics
  - Admin controls

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5.0 + TailwindCSS 4.0
- **Authentication**: Auth.js (@auth/sveltekit)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini API
- **Email**: Nodemailer
- **Styling**: TailwindCSS
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL (or Docker)
- Google Cloud Console account (for OAuth)
- GitHub Developer account (for OAuth)
- Google AI Studio account (for Gemini API)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd auth-app
pnpm install
```

### 2. Environment Setup

Create a `.env` file based on `env.example`:

```bash
# Auth.js Configuration
AUTH_SECRET=your-super-secret-key-here
AUTH_URL=http://localhost:5173
AUTH_TRUST_HOST=true

# Database
DATABASE_URL=postgresql://root:mysecretpassword@localhost:5433/local

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

### 3. Database Setup

```bash
# Start PostgreSQL
pnpm db:start

# Push schema to database
pnpm db:push

# Seed with test users (optional)
pnpm db:seed
```

### 4. Run Development Server

```bash
pnpm dev --open
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

## 📚 Available Scripts

```bash
# Development
pnpm dev              # Start development server
pnpm build            # Build for production
pnpm preview          # Preview production build

# Database
pnpm db:start         # Start PostgreSQL container
pnpm db:push          # Push schema to database
pnpm db:generate      # Generate migrations
pnpm db:migrate       # Run migrations
pnpm db:studio        # Open Drizzle Studio
pnpm db:seed          # Seed database with test users

# Code Quality
pnpm check            # Type check
pnpm lint             # Lint code
pnpm format           # Format code
```

## 🔐 OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 Client ID
3. Set Application type to "Web application"
4. Add redirect URI: `http://localhost:5173/auth/callback/google`
5. Copy Client ID and Client Secret

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set Homepage URL: `http://localhost:5173`
4. Set Authorization callback URL: `http://localhost:5173/auth/callback/github`
5. Copy Client ID and generate Client Secret

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── auth.ts           # Auth.js configuration
│   ├── db/               # Database setup & schema
│   ├── email.ts          # Email utilities
│   └── ...
├── routes/
│   ├── auth/             # Authentication pages
│   ├── dashboard/        # User dashboard
│   ├── admin/            # Admin panel
│   ├── chat/             # AI chat interface
│   └── profile/          # User profile
└── ...
```

## 🔒 Security Features

- **Session Protection**: Automatic redirects for unauthenticated users
- **Role-Based Access**: Admin-only routes protected
- **CSRF Protection**: Built-in SvelteKit CSRF protection
- **Password Hashing**: bcrypt for secure password storage
- **OAuth Security**: Secure OAuth flow with proper callbacks

## 🚀 Deployment

### Environment Variables
Ensure all required environment variables are set in production:
- `AUTH_SECRET`: Strong, random secret
- `AUTH_URL`: Your production domain
- `DATABASE_URL`: Production database connection
- OAuth credentials for production domains

### Database
- Use production PostgreSQL instance
- Run migrations: `pnpm db:migrate`
- Ensure proper database permissions

## 🐛 Troubleshooting

### Common Issues

1. **OAuth 401 Error**: Check OAuth app configuration and redirect URIs
2. **Database Connection**: Verify PostgreSQL is running and credentials are correct
3. **Session Issues**: Ensure `AUTH_SECRET` is set and unique
4. **Email Not Working**: Check SMTP configuration and credentials

### Debug Mode
Enable debug mode in development:
```typescript
// src/lib/auth.ts
debug: process.env.NODE_ENV !== 'production'
```

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review Auth.js documentation

---

Built with ❤️ using SvelteKit and Auth.js
