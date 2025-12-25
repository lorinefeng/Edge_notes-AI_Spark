import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { noteFiles, notes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth";

export async function GET(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const fileId = parseInt(params.id);

  if (isNaN(fileId)) {
    return new NextResponse("Invalid ID", { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    // 1. Get file metadata
    const fileRecord = await db.select().from(noteFiles).where(eq(noteFiles.id, fileId)).get();

    if (!fileRecord) {
      return new NextResponse("File not found", { status: 404 });
    }

    // 2. Check permissions
    let isAllowed = false;

    // If linked to a note, check note permissions
    if (fileRecord.noteId) {
      const note = await db.select().from(notes).where(eq(notes.id, fileRecord.noteId)).get();
      if (note) {
        if (note.isPublic) {
          isAllowed = true;
        } else {
          // Private note: check if current user is author
          const user = await getCurrentUser();
          if (user && user.sub === note.userId) {
            isAllowed = true;
          }
        }
      } else {
        // Note might have been deleted? Or data inconsistency.
        // Fallback to checking file ownership
        const user = await getCurrentUser();
        if (user && user.sub === fileRecord.userId) {
          isAllowed = true;
        }
      }
    } else {
      // Orphan file (e.g., just uploaded in draft): only author can see
      const user = await getCurrentUser();
      if (user && user.sub === fileRecord.userId) {
        isAllowed = true;
      }
    }

    if (!isAllowed) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // 3. Serve from R2
    const object = await env.STORAGE.get(fileRecord.r2Key);

    if (!object) {
      return new NextResponse("Object not found in storage", { status: 404 });
    }

    const headers = new Headers();
    object.writeHttpMetadata(headers as any);
    headers.set("etag", object.httpEtag);
    headers.set("Content-Type", fileRecord.contentType);
    // Cache control for public assets? Maybe careful with private ones.
    // Let's set a reasonable cache
    headers.set("Cache-Control", "private, max-age=3600");

    return new NextResponse(object.body as any, {
      headers,
    });

  } catch (e: any) {
    console.error("File retrieval error:", e);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
