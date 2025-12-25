import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { noteFiles } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { nanoid } from "nanoid";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  // Allow guests to upload, use "guest" as userId if not logged in
  const userId = user ? user.sub : "guest";

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  // 5MB limit
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File too large (max 5MB)" }, { status: 400 });
  }

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  try {
    const timestamp = Date.now();
    const random = nanoid(6);
    // Sanitize filename to avoid path issues
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const r2Key = `uploads/${userId}/${timestamp}_${random}_${safeName}`;

    // Upload to R2
    await env.STORAGE.put(r2Key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Record in DB
    const result = await db.insert(noteFiles).values({
      userId,
      r2Key,
      fileName: file.name,
      contentType: file.type,
      size: file.size,
      noteId: null, // Initially null, will be linked when note is saved
    }).returning();

    const fileRecord = result[0];

    return NextResponse.json({
      id: fileRecord.id,
      url: `/api/file/${fileRecord.id}`,
      alt: fileRecord.fileName,
    });
  } catch (e: any) {
    console.error("Upload error:", e);
    return NextResponse.json({ error: "Upload failed: " + e.message }, { status: 500 });
  }
}
