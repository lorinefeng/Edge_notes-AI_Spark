import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteViews } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const user = await getCurrentUser();

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    // 1. Get Note ID
    const note = await db.select({ id: notes.id }).from(notes).where(eq(notes.slug, slug)).get();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const ip = req.headers.get("cf-connecting-ip") || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    
    // Hash the visitor info to protect privacy
    const rawString = `${ip}-${userAgent}`;
    const msgBuffer = new TextEncoder().encode(rawString);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const visitorHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // 2. Check if already viewed recently (optional, skipping complex logic for now, just record)
    // To avoid spamming the views table, maybe check if a view exists from this hash in the last hour?
    // Let's keep it simple: Record view + Increment Counter.
    
    // Check duplication for today to avoid F5 spamming view count too much
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentView = await db.select().from(noteViews).where(
      and(
        eq(noteViews.noteId, note.id),
        eq(noteViews.visitorHash, visitorHash),
        sql`created_at > ${oneHourAgo}`
      )
    ).get();

    if (!recentView) {
      await db.insert(noteViews).values({
        noteId: note.id,
        userId: user?.sub,
        visitorHash,
        location: req.headers.get("cf-ipcity") || req.headers.get("cf-ipcountry"),
      });

      // Increment view count
      await db.update(notes)
        .set({ viewCount: sql`view_count + 1` })
        .where(eq(notes.id, note.id));
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("View API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
