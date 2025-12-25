import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteComments, noteFiles } from "@/db/schema";
import { eq, desc, sql, inArray, and } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";
import { z } from "zod";

const commentSchema = z.object({
  content: z.string().min(1).max(1000),
});

export async function GET(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  const note = await db.select({ id: notes.id }).from(notes).where(eq(notes.slug, slug)).get();
  if (!note) return NextResponse.json([], { status: 404 });

  const comments = await db.select()
    .from(noteComments)
    .where(eq(noteComments.noteId, note.id))
    .orderBy(desc(noteComments.createdAt))
    .all();

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const user = await getCurrentUser();
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const json = await req.json();
    const body = commentSchema.parse(json);

    const note = await db.select({ id: notes.id }).from(notes).where(eq(notes.slug, slug)).get();
    if (!note) return NextResponse.json({ error: "Note not found" }, { status: 404 });

    let guestName = "Anonymous";
    let userId = null;
    let isAnonymous = false;

    if (user) {
      guestName = user.name;
      userId = user.sub;
    } else {
      // Auto-generate name for anonymous
      const city = req.headers.get("cf-ipcity") || "Unknown City";
      const country = req.headers.get("cf-ipcountry") || "Earth";
      const location = city !== "Unknown City" ? city : country;
      guestName = `Visitor from ${location}`;
      isAnonymous = true;
    }

    const result = await db.insert(noteComments).values({
      noteId: note.id,
      userId,
      guestName,
      content: body.content,
      isAnonymous,
    }).returning();

    // Link uploaded files in comment to the note
    const fileIds = [...body.content.matchAll(/\/api\/file\/(\d+)/g)].map(m => parseInt(m[1]));
    if (fileIds.length > 0) {
      await db.update(noteFiles)
        .set({ noteId: note.id })
        .where(inArray(noteFiles.id, fileIds));
    }

    // Increment comment count
    await db.update(notes)
      .set({ commentCount: sql`comment_count + 1` })
      .where(eq(notes.id, note.id));

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
