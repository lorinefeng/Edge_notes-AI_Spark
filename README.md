# Edge Notes

A minimalist, AI-powered note-taking application built with Next.js, Cloudflare Pages, Cloudflare D1, and GitHub OAuth.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- **📝 Smart Note Creation**: Create private or public notes with Markdown support.
- **✨ AI Polishing**: 
  - Integrated with MiniMax M2 (Anthropic-compatible) for intelligent text enhancement.
  - **4 Preset Styles**: Concise, Academic, Colloquial, Formal.
  - **Custom Style**: User-defined instructions for personalized polishing.
  - **Diff View**: Visual comparison of changes before applying.
  - **Quota System**: Daily free limits with mock billing integration.
- **🔍 Search & Organize**: View latest 20 notes with instant search.
- **🔒 Secure Auth**: GitHub OAuth with stateless JWT sessions (HTTP-only cookies).
- **🌍 Public Sharing**: Generate unique public links for sharing notes.
- **⚡ Edge Deployed**: High-performance deployment on Cloudflare Workers/Pages.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Deployment**: Cloudflare Workers (via OpenNext)
- **Database**: Cloudflare D1 (SQLite)
- **ORM**: Drizzle ORM
- **Auth**: GitHub OAuth + JWT
- **Styling**: Tailwind CSS

## Setup & Run Locally

### 1. Install Dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.dev.vars` file in the root directory (do not commit this file) and fill in your credentials:

```bash
# Auth
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
JWT_SECRET=your_jwt_secret

# AI Service (MiniMax/Anthropic)
ANTHROPIC_API_KEY=your_minimax_api_key
ANTHROPIC_BASE_URL=https://api.minimaxi.com/anthropic
ANTHROPIC_MODEL=MiniMax-M2
```

### 3. Database Setup
The project uses Cloudflare D1. For local development, Wrangler handles the local SQLite instance.

Generate migrations:
```bash
npm run db:generate
```

Apply migrations locally:
```bash
npm run db:migrate:local
```

### 4. Run Development Server
```bash
npm run preview
```
This builds the app using `@opennextjs/cloudflare` and runs it with `wrangler dev`.

## Deployment

This project is configured for automated deployment to Cloudflare Workers via GitHub Actions.

1. **Push to GitHub**: Pushing to the `main` branch triggers the deployment workflow.
2. **Secrets**: Ensure the following secrets are set in your GitHub Repository settings:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
   - `ANTHROPIC_API_KEY`
   - `GITHUB_CLIENT_ID`
   - `GITHUB_CLIENT_SECRET`
   - `JWT_SECRET`

## Project Structure

- `src/app`: Next.js App Router pages.
- `src/api`: Backend API routes (AI, Auth).
- `src/components`: React components (AI Polish, Diff View, etc.).
- `src/db`: Drizzle ORM schema and config.
- `src/lib`: Utility functions.
- `drizzle/`: SQL migrations.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
