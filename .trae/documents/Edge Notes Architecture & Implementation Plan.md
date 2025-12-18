# Edge Notes Project Architecture Plan

Based on your requirements, I have designed a lightweight, scalable architecture focusing on engineering boundaries and security using the Next.js + Cloudflare stack.

## 1. Technology Stack
- **Framework:** Next.js 14+ (App Router)
- **Runtime:** Cloudflare Pages (Edge Runtime)
- **Database:** Cloudflare D1 (SQLite)
- **ORM:** Drizzle ORM (Type-safe, best-in-class for D1)
- **Styling:** Tailwind CSS
- **Auth:** GitHub OAuth 2.0 (Stateless JWT in HTTP-only Cookie)

## 2. Database Schema (D1)
We will use a `notes` table with the following structure:
| Column | Type | Description |
|--------|------|-------------|
| `id` | Integer (PK) | Auto-increment ID |
| `user_id` | Text | GitHub User ID (Owner) |
| `title` | Text | Note title |
| `content` | Text | Markdown content |
| `is_public` | Integer | Boolean flag (0/1) |
| `slug` | Text | Unique random string for sharing (Indexed) |
| `created_at` | Integer | Unix timestamp |
| `updated_at` | Integer | Unix timestamp |

## 3. Core Modules & Implementation

### A. Authentication (Boundary Security)
- **Strategy:** GitHub OAuth.
- **Implementation:**
  - `GET /api/auth/login`: Redirects to GitHub.
  - `GET /api/auth/callback`: Exchanges code for token, fetches user profile, creates a signed JWT session cookie.
- **Middleware:** Global `middleware.ts` to protect all routes (except `/share/*`, `/login`, `/api/auth/*`) by verifying the JWT.

### B. Feature Implementation
1.  **Create Note:**
    - Zod validation for inputs.
    - If `is_public` is true, generate a unique `slug` (using `nanoid`).
2.  **Notes List:**
    - Fetch query: `SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`.
    - Search: Add `AND (title LIKE ? OR content LIKE ?)` clause.
3.  **Public Share (`/share/:slug`):**
    - **Critical Boundary Check:** Query MUST be `SELECT * FROM notes WHERE slug = ? AND is_public = 1`.
    - If a note exists but `is_public` is 0, return 404 Not Found (do not reveal existence).

### C. Testing & Deployment
- **Local Dev:** Use `wrangler pages dev` with local D1 persistence.
- **Testing:** Unit tests for utility functions (slug generation, date formatting).

## 4. Execution Steps
1.  **Setup:** Initialize Next.js project and install dependencies (Drizzle, Wrangler, etc.).
2.  **Database:** Configure `wrangler.toml`, define schema, and generate migrations.
3.  **Auth:** Implement the OAuth flow and JWT handling.
4.  **UI & Logic:** Build the Create, List, Detail, and Share pages with API integration.
5.  **Review:** Verify security boundaries (e.g., trying to access private note via public URL).

Does this plan meet your expectations?