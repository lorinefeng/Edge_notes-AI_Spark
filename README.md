# Edge Notes

A minimalist note-taking application built with Next.js, Cloudflare Pages, Cloudflare D1, and GitHub OAuth.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Deployment**: Cloudflare Workers (via OpenNext)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Auth**: GitHub OAuth + JWT (Stateless)
- **Styling**: Tailwind CSS

## Setup & Run Locally

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Environment Variables**
   Create a `.dev.vars` file in the root directory (copied from `.dev.vars.example`) and fill in your credentials.
   ```
   GITHUB_CLIENT_ID=...
   GITHUB_CLIENT_SECRET=...
   JWT_SECRET=...
   ```

3. **Database Setup**
   The project uses Cloudflare D1. For local development, Wrangler handles the local SQLite instance.
   
   Generate migrations (if schema changes):
   ```bash
   npm run db:generate
   ```
   
   Apply migrations locally:
   ```bash
   npm run db:migrate:local
   ```

4. **Run Development Server**
   ```bash
   npm run preview
   ```
   This builds the app using `@opennextjs/cloudflare` and runs it with `wrangler dev` to simulate the Cloudflare Workers environment.
   
   *Note: On Windows, you might encounter issues with `wrangler dev` due to file system compatibility with bundled assets (e.g., `resvg.wasm`). Using WSL or deploying to Cloudflare is recommended if this occurs.*

5. **Deploy to Cloudflare**
   ```bash
   npm run deploy
   ```

## Project Structure

- `src/app`: Next.js App Router pages.
- `src/db`: Drizzle ORM schema and config.
- `src/lib`: Utility functions (Auth, etc.).
- `src/middleware.ts`: Middleware for authentication protection.
- `drizzle/`: SQL migrations.
- `open-next.config.ts`: OpenNext configuration.

## Features

- **Create Note**: Create private or public notes (Markdown supported).
- **List Notes**: View your latest 20 notes with search functionality.
- **Note Detail**: Protected view for note owners.
- **Public Share**: Publicly accessible unique links for notes marked as public.
- **Authentication**: GitHub OAuth with secure HTTP-only cookies.
