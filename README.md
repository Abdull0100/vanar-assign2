# Full Auth.js Application with AI Chat Interface

A complete authentication system built with SvelteKit, Auth.js, Drizzle ORM, and Google Gemini AI integration.

## 🚀 Features

### Authentication & Authorization
- **Multiple Auth Methods**: Email/password, Google OAuth, GitHub OAuth
- **Database Sessions**: PostgreSQL with Drizzle ORM (no JWT)
- **Protected Routes**: Dashboard and user-only pages
- **Profile Management**: View and update user profiles
- **Admin Role & Dashboard**: 
  - View all registered users
  - Basic user analytics/statistics
  - Admin controls (role change, user management)

### Database & ORM
- **PostgreSQL** with Drizzle ORM
- **Proper Schema**: Users, accounts, sessions, verification tokens, chat messages
- **Drizzle Studio**: Database management interface

### OAuth & Email Flows
- **OAuth Providers**: Google & GitHub sign-in
- **Email Verification**: During signup with secure tokens
- **Password Reset**: Via secure email links

### AI Chat Interface
- **Vercel AI SDK** with Gemini API
- **Modern UI**: SvelteKit + TailwindCSS
- **Features**: User input, response display, loading states, error handling
- **Chat History**: Persistent storage in PostgreSQL

## 🛠️ Tech Stack

- **Frontend**: SvelteKit 5.0
- **Styling**: TailwindCSS 4.0
- **Authentication**: Auth.js (@auth/sveltekit)
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Google Gemini API
- **Email**: Nodemailer
- **Package Manager**: pnpm

## 📋 Prerequisites

- Node.js 18+ 
- pnpm
- Docker (for PostgreSQL)
- Google OAuth credentials
- GitHub OAuth credentials
- Gemini API key
- SMTP credentials (Gmail recommended)

## 🚀 Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd auth-app
pnpm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```bash
# Database
DATABASE_URL="postgresql://root:mysecretpassword@localhost:5432/local"

# Auth.js
AUTH_SECRET="your-32-character-secret-key-here"
AUTH_URL="http://localhost:5173"
AUTH_TRUST_HOST="true"

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# SMTP Configuration
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="your-email@gmail.com"

# AI Configuration
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Start Database

```bash
pnpm db:start
```

### 4. Push Database Schema

```bash
pnpm db:push
```

### 5. Run Development Server

```bash
pnpm dev
```

Visit [http://localhost:5173](http://localhost:5173) to see your app!

## 🔧 Available Scripts

```bash
# Development
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm preview      # Preview production build

# Database
pnpm db:start     # Start PostgreSQL with Docker
pnpm db:push      # Push schema to database
pnpm db:generate  # Generate migrations
pnpm db:migrate   # Run migrations
pnpm db:studio    # Open Drizzle Studio

# Code Quality
pnpm check        # Type checking
pnpm lint         # Lint code
pnpm format       # Format code
pnpm test         # Run tests
```

## 🗄️ Database Schema

The application uses the following main tables:

- **users**: User accounts with roles and verification status
- **accounts**: OAuth provider connections
- **sessions**: Active user sessions
- **verificationTokens**: Email verification and password reset tokens
- **chatMessages**: AI chat conversation history

## 🔐 OAuth Setup

### Google OAuth
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:5173/auth/callback/google`

### GitHub OAuth
1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Create new OAuth App
3. Set callback URL: `http://localhost:5173/auth/callback/github`

## 📧 SMTP Setup

### Gmail (Recommended)
1. Enable 2-factor authentication
2. Generate App Password
3. Use App Password in SMTP_PASS

### Other Providers
Update SMTP_HOST, SMTP_PORT, and credentials accordingly

## 🤖 Gemini AI Setup

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create API key
3. Add to GEMINI_API_KEY environment variable

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically

### Other Platforms
- Set `AUTH_TRUST_HOST=true`
- Configure environment variables
- Ensure PostgreSQL connection

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── auth.ts          # Auth.js configuration
│   ├── db/              # Database setup
│   │   ├── index.ts     # Database connection
│   │   └── schema.ts    # Database schema
│   └── email.ts         # Email utilities
├── routes/
│   ├── api/             # API endpoints
│   │   ├── auth/        # Authentication APIs
│   │   ├── admin/       # Admin APIs
│   │   └── chat/        # AI Chat API
│   ├── auth/            # Auth pages
│   ├── dashboard/       # User dashboard
│   ├── admin/           # Admin panel
│   └── chat/            # AI chat interface
└── app.html             # HTML template
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **Session Management**: Secure database sessions
- **CSRF Protection**: Built-in SvelteKit protection
- **Rate Limiting**: Implemented on API endpoints
- **Input Validation**: Server-side validation
- **SQL Injection Protection**: Drizzle ORM parameterization

## 🧪 Testing

```bash
# Unit tests
pnpm test:unit

# E2E tests
pnpm test:e2e

# All tests
pnpm test
```

## 📝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'feat: add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Troubleshooting

### Common Issues

**Database Connection Error**
- Ensure PostgreSQL is running: `pnpm db:start`
- Check DATABASE_URL in .env file
- Verify Docker is running

**OAuth Errors**
- Check OAuth credentials in .env
- Verify redirect URIs match exactly
- Ensure OAuth apps are properly configured

**Email Not Sending**
- Verify SMTP credentials
- Check firewall/network settings
- Use Gmail App Password if using Gmail

**Build Errors**
- Clear node_modules: `rm -rf node_modules pnpm-lock.yaml`
- Reinstall: `pnpm install`
- Check Node.js version compatibility

## 🎯 Next Steps

- [ ] Add password reset functionality
- [ ] Implement user profile editing
- [ ] Add more OAuth providers
- [ ] Enhance admin analytics
- [ ] Add user activity logging
- [ ] Implement API rate limiting
- [ ] Add comprehensive testing
- [ ] Set up CI/CD pipeline

## 📞 Support

For issues and questions:
- Check existing GitHub issues
- Create new issue with detailed description
- Join our community discussions

---

Built with ❤️ using modern web technologies
