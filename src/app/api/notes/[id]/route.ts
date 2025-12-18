import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";
import { nanoid } from "nanoid";

const updateNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isPublic: z.boolean(),
});

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const noteId = parseInt(params.id);
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(noteId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const json = await req.json();
    const body = updateNoteSchema.parse(json);

    // Get existing note to check ownership and handle slug logic
    const existingNote = await db.select().from(notes).where(
      and(eq(notes.id, noteId), eq(notes.userId, userId))
    ).get();

    if (!existingNote) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    let slug = existingNote.slug;
    if (body.isPublic && !slug) {
      slug = nanoid(10);
    }

    const result = await db.update(notes)
      .set({
        title: body.title,
        content: body.content,
        isPublic: body.isPublic,
        slug,
        updatedAt: new Date(), // Manually update this since D1/SQLite behavior can vary
      })
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    return NextResponse.json(result[0]);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const noteId = parseInt(params.id);
  const userId = req.headers.get("x-user-id");

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (isNaN(noteId)) {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const result = await db.delete(notes)
      .where(and(eq(notes.id, noteId), eq(notes.userId, userId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
