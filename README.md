# Vanar Assignment — SvelteKit + Drizzle ORM + PostgreSQL


A minimal SvelteKit app wired with Drizzle ORM (PostgreSQL) and ready-to-run DB scripts.

## Quick start

1) Install dependencies
- pnpm install

2) Configure environment
- Copy .env.example to .env and adjust if needed
- Ensure DATABASE_URL points to your Postgres instance

3) Start PostgreSQL (via Docker)
- pnpm db:start
- This launches a Postgres container on localhost:5432 with credentials from docker-compose.yml

4) Create/apply database schema
- Generate migrations from current schema
  pnpm db:generate
- Apply schema to the database (no manual edits needed)
  pnpm db:push
- Alternatively, if you plan to manage migration files, run migrations with
  pnpm db:migrate

5) (Optional) Inspect data with Drizzle Studio
- pnpm db:studio

6) Run the dev server
- pnpm dev
- Open the printed URL (Vite will show it in the terminal)

## Available scripts
- dev: start the Vite dev server
- build: production build
- preview: preview the production build
- check / check:watch: type-check with svelte-check
- format / lint: Prettier + ESLint
- test / test:e2e: run Playwright tests
- db:start: start Postgres via Docker Compose
- db:generate: generate migrations from your Drizzle schema
- db:push: apply the current schema directly to the database
- db:migrate: run generated migrations
- db:studio: open Drizzle Studio

## Database schema (Drizzle)
Defined at src/lib/server/db/schema.ts. The following tables are included:
- user: base user profile (string id, email, name, image, timestamps)
- account: OAuth provider accounts (composite PK: provider + providerAccountId)
- session: sessions linked to userId
- verificationToken: for email verification / password resets
- chat: simple chat container owned by a user (config JSON, pinned/archived flags)

## Notes
- Ensure your DATABASE_URL in .env matches your Postgres instance (Docker or local).
- When using Docker, data persists in the named volume defined in docker-compose.yml.