import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteComments } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const commentId = parseInt(params.id);
  const user = await getCurrentUser();

  if (!user || user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const comment = await db.select().from(noteComments).where(eq(noteComments.id, commentId)).get();
    if (!comment) return NextResponse.json({ error: "Comment not found" }, { status: 404 });

    await db.delete(noteComments).where(eq(noteComments.id, commentId));

    // Decrement comment count
    await db.update(notes)
      .set({ commentCount: sql`max(0, comment_count - 1)` })
      .where(eq(notes.id, comment.noteId));

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
