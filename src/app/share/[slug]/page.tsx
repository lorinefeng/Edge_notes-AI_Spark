import { notFound } from "next/navigation";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { eq, and } from "drizzle-orm";

async function getPublicNote(slug: string) {
  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  
  // Boundary Check: Must be public and match slug
  const note = await db.select().from(notes).where(
    and(eq(notes.slug, slug), eq(notes.isPublic, true))
  ).get();

  return note;
}

export default async function PublicSharePage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const { slug } = params;
  const note = await getPublicNote(slug);

  if (!note) {
    notFound();
  }

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

          <div className="prose prose-slate dark:prose-invert max-w-none font-mono text-base leading-relaxed whitespace-pre-wrap text-foreground/90 border-t border-border/50 pt-8">
            {note.content}
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
        </div>
      </div>
    </div>
  );
}
