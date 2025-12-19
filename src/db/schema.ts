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
