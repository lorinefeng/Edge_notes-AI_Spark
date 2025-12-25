import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const notes = sqliteTable(
  "notes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    userId: text("user_id").notNull(),
    authorName: text("author_name"),
    title: text("title").notNull(),
    content: text("content").notNull(),
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    slug: text("slug"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
    viewCount: integer("view_count").notNull().default(0),
    likeCount: integer("like_count").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
  },
  (table) => {
    return {
      slugIdx: index("slug_idx").on(table.slug),
      userIdIdx: index("user_id_idx").on(table.userId),
    };
  }
);

export const userQuotas = sqliteTable(
  "user_quotas",
  {
    userId: text("user_id").primaryKey(),
    dailyCount: integer("daily_count").notNull().default(0),
    lastResetDate: text("last_reset_date").notNull(),
    monthlyTokenUsage: integer("monthly_token_usage").notNull().default(0),
    balance: integer("balance").notNull().default(0),
    emailAlertSent: integer("email_alert_sent", { mode: "boolean" }).notNull().default(false),
    updatedAt: integer("updated_at", { mode: "timestamp" })
      .notNull()
      .default(sql`(unixepoch())`)
      .$onUpdate(() => new Date()),
  }
);

export const noteViews = sqliteTable(
  "note_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("note_id").notNull(), // Foreign key to notes.id
    userId: text("user_id"), // Nullable (for guests)
    visitorHash: text("visitor_hash"), // IP-based hash for uniqueness check
    location: text("location"), // "Beijing, China"
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  },
  (table) => ({
    noteIdIdx: index("views_note_id_idx").on(table.noteId),
  })
);

export const noteLikes = sqliteTable(
  "note_likes",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("note_id").notNull(),
    userId: text("user_id"), // Nullable
    ipAddress: text("ip_address"), // For abuse prevention
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  },
  (table) => ({
    noteIdIdx: index("likes_note_id_idx").on(table.noteId),
    userIdIdx: index("likes_user_id_idx").on(table.userId),
    ipAddressIdx: index("likes_ip_address_idx").on(table.ipAddress),
  })
);

export const noteComments = sqliteTable(
  "note_comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    noteId: integer("note_id").notNull(),
    userId: text("user_id"), // Nullable
    guestName: text("guest_name"), // "Visitor from..." or Custom Nickname
    content: text("content").notNull(),
    isAnonymous: integer("is_anonymous", { mode: "boolean" }).default(false),
    createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
  },
  (table) => ({
    noteIdIdx: index("comments_note_id_idx").on(table.noteId),
  })
);

export const noteFiles = sqliteTable("note_files", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  noteId: integer("note_id"), // Can be null if uploaded before note creation
  userId: text("user_id").notNull(),
  r2Key: text("r2_key").notNull(),
  fileName: text("file_name").notNull(),
  contentType: text("content_type").notNull(),
  size: integer("size").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" }).default(sql`(unixepoch())`),
});
