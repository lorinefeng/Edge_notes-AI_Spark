import Link from "next/link";
import { ArrowLeft, Globe, Share2 } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

async function getNote(id: number) {
  const { env } = await getCloudflareContext();
  const headerList = await headers();
  const userId = headerList.get("x-user-id");
  if (!userId) return null;

  const db = drizzle(env.DB);
  const note = await db.select().from(notes).where(
    and(eq(notes.id, id), eq(notes.userId, userId))
  ).get();

  return note;
}

export default async function NoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const note = await getNote(id);
  if (!note) notFound();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/" className="flex items-center text-gray-600 hover:text-gray-900">
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back
        </Link>
        <div className="flex items-center space-x-4">
          {note.isPublic && (
             <div className="flex items-center text-green-600 text-sm">
                <Globe className="h-4 w-4 mr-1" />
                Public
             </div>
          )}
          {note.isPublic && note.slug && (
            <Link
               href={`/share/${note.slug}`}
               target="_blank"
               className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share Link
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">{note.title}</h1>
        <div className="prose max-w-none font-mono whitespace-pre-wrap text-sm">
          {note.content}
        </div>
      </div>
    </div>
  );
}
