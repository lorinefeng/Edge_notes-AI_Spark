# Edge Notes - Social Features & Guest Mode Plan

## 1. Overview
This document outlines the technical implementation for adding social interaction features (Views, Likes, Comments) and a Guest Mode to Edge Notes.

## 2. Guest Mode Implementation
### 2.1 Login Page Update
*   **UI**: Add a secondary button "Continue as Guest" below the GitHub login button on `src/app/login/page.tsx`.
*   **Logic**:
    *   Clicking "Continue as Guest" triggers a server action or API call to `/api/auth/guest`.
    *   **Guest Session**: Create a JWT session similar to the main auth, but with:
        *   `sub`: `guest_${nanoid()}`
        *   `name`: `Visitor_${city}` (e.g., "Visitor from Beijing") - determined via Cloudflare headers.
        *   `role`: `guest`
    *   **Persistence**: Store in the same `session` cookie.

### 2.2 Permissions
| Feature | Logged-in User (GitHub) | Guest User |
| :--- | :--- | :--- |
| Create Notes | Yes (Saved to DB) | Yes (Saved to DB, Public by default or choice) |
| Edit Notes | Yes (Own notes) | Yes (Own notes, **session-bound**) |
| Delete Notes | Yes (Own notes) | Yes (Own notes, **session-bound**) |
| View Public Notes | Yes | Yes |
| Like Notes | Yes | Yes (IP restricted) |
| Comment | Yes | Yes |
| **Admin (lorinefeng)** | **Full Control (Delete any content)** | - |

> **Note on Guest Data**: Guest notes are tied to their specific browser session (cookie). If they clear cookies, they lose access to edit/delete their notes, but the notes remain public (unless we add auto-expiry).

---

## 3. Database Schema (Drizzle/SQLite)

### 3.1 Modify `notes` Table
Add counters to reduce count queries.
```typescript
// src/db/schema.ts
export const notes = sqliteTable("notes", {
  // ... existing fields
  viewCount: integer("view_count").default(0),
  likeCount: integer("like_count").default(0),
  commentCount: integer("comment_count").default(0),
});
```

### 3.2 New Tables
```typescript
export const noteViews = sqliteTable("note_views", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id").notNull(), // Foreign key to notes.id
  userId: text("user_id"), // Nullable (for guests)
  visitorHash: text("visitor_hash"), // IP-based hash for uniqueness check
  location: text("location"), // "Beijing, China"
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const noteLikes = sqliteTable("note_likes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id").notNull(),
  userId: text("user_id"), // Nullable
  ipAddress: text("ip_address"), // For abuse prevention
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});

export const noteComments = sqliteTable("note_comments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id").notNull(),
  userId: text("user_id"), // Nullable
  guestName: text("guest_name"), // "Visitor from..." or Custom Nickname
  content: text("content").notNull(),
  isAnonymous: integer("is_anonymous", { mode: "boolean" }).default(false),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
```

---

## 4. API & Backend Logic

### 4.1 Middleware / Auth
*   Update `src/lib/auth.ts`:
    *   `getCurrentUser()` should handle both GitHub users and Guest users.
    *   Identify Admin: Check if `user.name === 'lorinefeng'` (or `user.sub` matches specific ID).

### 4.2 New API Routes
*   `POST /api/auth/guest`: Create guest session.
*   `POST /api/public/notes/[slug]/view`:
    *   Record view in `note_views`.
    *   Increment `notes.view_count`.
    *   Use `CF-Connecting-IP` or session ID to prevent duplicate view counts in short time.
*   `POST /api/public/notes/[slug]/like`:
    *   Check if IP/User already liked.
    *   Toggle like (Add/Remove).
    *   Update `notes.like_count`.
*   `GET /api/public/notes/[slug]/comments`: Fetch comments.
*   `POST /api/public/notes/[slug]/comments`:
    *   Validate content (length, bad words filter?).
    *   Save to `note_comments`.
    *   Increment `notes.comment_count`.
*   **Admin APIs**:
    *   `DELETE /api/admin/comments/[id]`: Delete any comment.
    *   `DELETE /api/admin/notes/[id]`: Delete any note.
    *   *Security*: Middleware must verify `user.name === 'lorinefeng'`.

---

## 5. Frontend Implementation

### 5.1 Public Note Page (`src/app/share/[slug]/page.tsx`)
*   **Layout**:
    *   **Header**: Title, Date, View Count.
    *   **Content**: Markdown Viewer.
    *   **Footer**:
        *   **Like Button**: Floating or fixed at bottom. Shows count. Animate on click.
        *   **Comment Section**:
            *   List of comments (Avatar + Name + Content + Date).
            *   Input box (Textarea + "Post" button).
*   **Visitor List**:
    *   "Recent Visitors": Show avatars (or generated initials) of last 5 unique visitors in `note_views`.

### 5.2 Guest Dashboard
*   If user is Guest, show a simplified Dashboard.
*   "My Guest Notes" (Filtered by `user_id` = current guest session ID).

---

## 6. Security & Anti-Spam
*   **IP Rate Limiting**: Limit Likes/Comments per IP per minute (using Cloudflare features or simple DB timestamp check).
*   **Admin Tools**: Hardcoded admin check for `lorinefeng` to delete content.
