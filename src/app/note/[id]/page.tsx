import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Share2 } from "lucide-react";
import { NoteActions } from "@/components/note-actions";

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
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Navigation */}
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center text-muted-foreground hover:text-primary transition-colors font-medium group"
          >
            <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 mr-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back
          </Link>
          
          <div className="flex items-center gap-3">
            {note.isPublic && (
               <div className="flex items-center px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium border border-green-500/20">
                  <Globe className="h-3 w-3 mr-1.5" />
                  Public
               </div>
            )}
            {note.isPublic && note.slug && (
              <Link
                 href={`/share/${note.slug}`}
                 target="_blank"
                 className="inline-flex items-center px-4 py-2 rounded-full border border-border bg-card text-sm font-medium text-foreground hover:bg-muted/50 hover:border-primary/30 hover:text-primary transition-all shadow-sm"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Link>
            )}
          </div>
        </div>

        {/* Client Component for Actions */}
        <NoteActions note={note} />
      </div>
    </div>
  );
}
