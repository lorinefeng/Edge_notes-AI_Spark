import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes, noteComments, noteViews } from "@/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { MarkdownViewer } from "@/components/markdown-viewer";
import { SocialInteractions } from "@/components/social-interactions";
import { getCurrentUser } from "@/lib/auth";

export default async function PublicSharePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  const user = await getCurrentUser();

  // 1. Fetch Note
  const note = await db.select().from(notes).where(
    and(eq(notes.slug, slug), eq(notes.isPublic, true))
  ).get();

  if (!note) {
    notFound();
  }

  // 2. Fetch Comments
  const comments = await db.select()
    .from(noteComments)
    .where(eq(noteComments.noteId, note.id))
    .orderBy(desc(noteComments.createdAt))
    .all();

  // 3. Fetch Recent Visitors (Distinct by hash roughly)
  // Since Drizzle's D1 adapter might have limited groupBy support in type safety, we'll fetch recent and filter in JS or just fetch last 10
  const recentViews = await db.select()
    .from(noteViews)
    .where(eq(noteViews.noteId, note.id))
    .orderBy(desc(noteViews.createdAt))
    .limit(20)
    .all();
  
  // Deduplicate visitors in JS for display
  const uniqueVisitors = Array.from(new Map(recentViews.map(v => [v.visitorHash, v])).values()).slice(0, 5);

  return (
    <div className="min-h-screen bg-background py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="max-w-3xl w-full pomelli-card rounded-2xl overflow-hidden shadow-2xl relative">
        {/* Decorative Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/20 blur-[60px] pointer-events-none" />
        
        <div className="relative z-10 p-8 sm:p-12">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4 font-serif glow-text leading-tight">
              {note.title}
            </h1>
            <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground font-medium">
              <span>{new Date(note.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              <span className="w-1 h-1 rounded-full bg-primary/50" />
              <span>Public Note</span>
            </div>
          </div>

          <div className="border-t border-border/50 pt-8">
            <MarkdownViewer content={note.content} className="text-foreground/90 font-mono text-base leading-relaxed" />
          </div>
          
          <div className="mt-12 pt-6 border-t border-border flex justify-between items-end">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Published By</span>
              <span className="text-lg font-serif text-primary italic font-medium">
                 {note.authorName || "Anonymous Scholar"}
              </span>
            </div>
            
            <a href="/" className="group flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-sm font-medium transition-all">
              Create your own
              <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
            </a>
          </div>

          {/* Social Interactions Section */}
          <SocialInteractions
            slug={slug}
            initialLikeCount={note.likeCount || 0}
            initialViewCount={note.viewCount || 0}
            initialComments={comments.map(c => ({
              ...c,
              guestName: c.guestName || "Anonymous", // Ensure guestName is not null
              createdAt: c.createdAt ? c.createdAt.toISOString() : new Date().toISOString(), // Ensure createdAt is string and not null
              isAnonymous: c.isAnonymous ?? false, // Provide default value for potentially null boolean
              userId: c.userId || undefined // Ensure userId is string or undefined (not null)
            }))}
            initialVisitors={uniqueVisitors.map(v => ({
              visitorHash: v.visitorHash || "unknown",
              location: v.location || undefined
            }))}
            currentUser={user}
          />
        </div>
      </div>
    </div>
  );
}
