# Edge Notes Project Improvement Plan

## ✅ Completed High-Priority Improvements (Security & Stability)

### 1. Authentication Security Hardening
*   **OAuth State Protection**: Implemented `state` parameter generation and verification in the GitHub OAuth flow to prevent CSRF attacks.
    *   `src/app/api/auth/login/route.ts`
    *   `src/app/api/auth/callback/route.ts`
*   **Session Cookie Security**: Enhanced cookie attributes with `SameSite=Lax` and robust `Secure` flag logic (checking `https` protocol).
*   **Logout Reliability**: Fixed logout logic to forcefully expire the session cookie using `maxAge: 0` and matching security flags.
    *   `src/app/api/auth/logout/route.ts`

### 2. Trust Boundary Reinforcement
*   **Removed Implicit Trust**: Stopped API routes from trusting `x-user-id` headers injected by middleware.
*   **`getCurrentUser` Helper**: Created a robust helper in `src/lib/auth.ts` to verify the session JWT directly from cookies within API contexts.
*   **Refactored Routes**: Updated all sensitive API routes to use `getCurrentUser` for authentication.
    *   `src/app/api/notes/route.ts`
    *   `src/app/api/notes/[id]/route.ts`
    *   `src/app/api/ai/polish/route.ts`

### 3. Error Handling
*   **Production Safety**: Sanitized error responses in the AI Polish API to prevent leaking stack traces or internal details in production environments.

---

## 📋 Future Roadmap (Medium/Low Priority)

### 1. Database & Data Integrity
*   **Timestamp Consistency**: Unify `created_at` and `updated_at` logic (ensure Drizzle and SQLite usage matches, e.g., using `unixepoch` consistently).
*   **Unique Constraints**: Add a unique index for `slug` in the `notes` table to strictly enforce uniqueness at the database level.
*   **Search Optimization**: Implement Full-Text Search (FTS5) in Cloudflare D1 for better scalability than `LIKE %...%`.

### 2. Concurrency & Quotas
*   **Atomic Updates**: Improve AI quota deduction logic to handle concurrent requests safely (e.g., using atomic increments or conditional updates).

### 3. Engineering & CI/CD
*   **Linting & Typecheck**: Add strict `tsc --noEmit` and `eslint` checks to the CI pipeline (`.github/workflows/deploy.yml`) to catch errors before deployment.
*   **Environment Variables**: Standardize `.dev.vars` and `README.md` documentation to ensure all required variables (like `ANTHROPIC_*`) are clearly listed.

### 4. Features
*   **Pagination**: Add cursor-based pagination for the notes list API.
*   **Rate Limiting**: Add global rate limiting (e.g., via Cloudflare Workers Rate Limiting) for API routes.
