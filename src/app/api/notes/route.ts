import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteFiles } from "@/db/schema";
import { desc, eq, like, or, and, inArray } from "drizzle-orm";
import { nanoid } from "nanoid";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";

const createNoteSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  isPublic: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.sub;
  const userName = user.name;

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const json = await req.json();
    const body = createNoteSchema.parse(json);
    
    let slug = null;
    if (body.isPublic) {
      slug = nanoid(10);
    }

    const result = await db.insert(notes).values({
      userId,
      authorName: userName || "Anonymous", // Save author name
      title: body.title,
      content: body.content,
      isPublic: body.isPublic,
      slug,
    }).returning();

    const note = result[0];

    // Link files found in content
    const fileIds = [...body.content.matchAll(/\/api\/file\/(\d+)/g)].map(m => parseInt(m[1]));
    if (fileIds.length > 0) {
      await db.update(noteFiles)
        .set({ noteId: note.id })
        .where(
           and(
             inArray(noteFiles.id, fileIds),
             eq(noteFiles.userId, userId)
           )
        );
    }

    return NextResponse.json(note);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.sub;

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  const search = req.nextUrl.searchParams.get("q");

  let whereClause = eq(notes.userId, userId);
  
  if (search) {
    whereClause = and(
      whereClause,
      or(like(notes.title, `%${search}%`), like(notes.content, `%${search}%`))
    ) as any;
  }

  const list = await db.select()
    .from(notes)
    .where(whereClause)
    .orderBy(desc(notes.createdAt))
    .limit(20)
    .all();

  return NextResponse.json(list);
}
