import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteComments, noteViews, noteLikes } from "@/db/schema";
import { eq, and, desc, or } from "drizzle-orm";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Globe, Share2 } from "lucide-react";
import { NoteActions } from "@/components/note-actions";
import { SocialInteractions } from "@/components/social-interactions";
import { getCurrentUser } from "@/lib/auth";
import { headers } from "next/headers";

export default async function NoteDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const id = parseInt(params.id);
  if (isNaN(id)) notFound();

  const user = await getCurrentUser();
  const userId = user?.sub;
  
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);

  // 1. Fetch Note
  // Allow if Author OR Public
  // We can't use simple AND because of the OR condition, so we fetch first then check, OR use OR in query
  // simpler to query by ID first
  const note = await db.select().from(notes).where(eq(notes.id, id)).get();

  if (!note) notFound();

  const isAuthor = userId === note.userId;
  
  // Access Control
  if (!isAuthor && !note.isPublic) {
    // If not author and not public, deny access
    // But if we are admin, maybe allow? (User requested Admin role)
    // User said "Admin can delete comments...", didn't say Admin can see private notes.
    // I'll stick to strict Author/Public for now.
    notFound(); 
  }

  // 2. Fetch Interactions (if public or author viewing)
  // We fetch these to display in SocialInteractions
  
  // Comments
  const comments = await db.select()
    .from(noteComments)
    .where(eq(noteComments.noteId, note.id))
    .orderBy(desc(noteComments.createdAt))
    .all();

  // Recent Views
  const recentViews = await db.select()
    .from(noteViews)
    .where(eq(noteViews.noteId, note.id))
    .orderBy(desc(noteViews.createdAt))
    .limit(20)
    .all();
  
  const uniqueVisitors = Array.from(new Map(recentViews.map(v => [v.visitorHash, v])).values()).slice(0, 5);

  // Check if liked by current user
  let isLiked = false;
  if (userId) {
    const likeRecord = await db.select().from(noteLikes).where(
      and(eq(noteLikes.noteId, note.id), eq(noteLikes.userId, userId))
    ).get();
    isLiked = !!likeRecord;
  } else {
    // Guest check by IP?
    const headerList = await headers();
    const ip = headerList.get("cf-connecting-ip") || "unknown";
    const likeRecord = await db.select().from(noteLikes).where(
        and(eq(noteLikes.noteId, note.id), eq(noteLikes.ipAddress, ip))
    ).get();
    isLiked = !!likeRecord;
  }

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

        {/* Note Content / Actions */}
        <NoteActions note={note} isAuthor={isAuthor} />

        {/* Social Interactions (Only for Public Notes or Author viewing their own Public Note?)
            User said "Note page... needs to implement like, comment..."
            Usually comments are for public notes. Private notes don't need comments?
            If I am author of a PRIVATE note, do I want comments? No.
            So only show if note.isPublic is true.
        */}
        {note.isPublic && note.slug && (
            <div className="mt-8 pt-8 border-t border-border/50">
                <SocialInteractions
                    slug={note.slug}
                    initialLikeCount={note.likeCount || 0}
                    initialViewCount={note.viewCount || 0}
                    initialComments={comments.map(c => ({
                        ...c,
                        guestName: c.guestName || "Anonymous",
                        createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(),
                        isAnonymous: c.isAnonymous ?? false,
                        userId: c.userId || undefined
                    }))}
                    initialVisitors={uniqueVisitors.map(v => ({
                        visitorHash: v.visitorHash || "unknown",
                        location: v.location || undefined
                    }))}
                    initialIsLiked={isLiked}
                    currentUser={user}
                />
            </div>
        )}
      </div>
    </div>
  );
}
