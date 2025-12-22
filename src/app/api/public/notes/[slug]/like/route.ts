import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteLikes } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const user = await getCurrentUser();
  const ip = req.headers.get("cf-connecting-ip") || "unknown";

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const note = await db.select({ id: notes.id }).from(notes).where(eq(notes.slug, slug)).get();

    if (!note) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    // Check if like exists
    let existingLike;
    
    if (user) {
      existingLike = await db.select().from(noteLikes).where(
        and(eq(noteLikes.noteId, note.id), eq(noteLikes.userId, user.sub))
      ).get();
    } else {
      existingLike = await db.select().from(noteLikes).where(
        and(
            eq(noteLikes.noteId, note.id), 
            eq(noteLikes.ipAddress, ip),
            sql`user_id IS NULL`
        )
      ).get();
    }

    let isLiked = false;

    if (existingLike) {
      // Unlike
      await db.delete(noteLikes).where(eq(noteLikes.id, existingLike.id));
      await db.update(notes)
        .set({ likeCount: sql`max(0, like_count - 1)` })
        .where(eq(notes.id, note.id));
      isLiked = false;
    } else {
      // Like
      await db.insert(noteLikes).values({
        noteId: note.id,
        userId: user?.sub, // Null if not logged in
        ipAddress: ip,
      });
      await db.update(notes)
        .set({ likeCount: sql`like_count + 1` })
        .where(eq(notes.id, note.id));
      isLiked = true;
    }

    // Get updated count
    const updatedNote = await db.select({ likeCount: notes.likeCount }).from(notes).where(eq(notes.id, note.id)).get();

    return NextResponse.json({ success: true, liked: isLiked, count: updatedNote?.likeCount || 0 });
  } catch (e: any) {
    console.error("Like API Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
