import Link from "next/link";
import { Plus, Search, Globe, Lock, FileText, Calendar, LogOut, User } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { desc, eq, like, or, and } from "drizzle-orm";
import { headers, cookies } from "next/headers";
import { verifySession } from "@/lib/auth";

async function getUser() {
  const { env } = await getCloudflareContext();
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) return null;
  
  const payload = await verifySession(token, env.JWT_SECRET);
  return payload as { sub: string; name: string; avatar_url?: string } | null;
}

async function getNotes(search?: string) {
  const { env } = await getCloudflareContext();
  const headerList = await headers();
  const userId = headerList.get("x-user-id");
  
  if (!userId) return []; 

  const db = drizzle(env.DB);
  
  let whereClause = eq(notes.userId, userId);
  
  if (search) {
    whereClause = and(
      whereClause,
      or(like(notes.title, `%${search}%`), like(notes.content, `%${search}%`))
    ) as any;
  }

  return await db.select()
    .from(notes)
    .where(whereClause)
    .orderBy(desc(notes.createdAt))
    .limit(20)
    .all();
}

export default async function Dashboard(props: { searchParams: Promise<{ q?: string }> }) {
  const searchParams = await props.searchParams;
  const { q } = searchParams;
  const [user, notesList] = await Promise.all([getUser(), getNotes(q)]);

  return (
    <div className="min-h-screen pb-20">
      {/* Navbar */}
      <header className="sticky top-0 z-50 glass">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 p-2 rounded-lg">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Edge Notes AI Spark</h1>
          </div>
          
          <div className="flex items-center gap-4">
            <Link
              href="/new"
              className="hidden sm:inline-flex items-center px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-all shadow-lg shadow-primary/25 active:scale-95"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Note
            </Link>

            {user && (
              <div className="flex items-center gap-3 pl-4 border-l border-border/50">
                <div className="flex items-center gap-2">
                  {user.avatar_url ? (
                    <img 
                      src={user.avatar_url} 
                      alt={user.name} 
                      className="h-8 w-8 rounded-full border border-border"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center border border-border">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                  )}
                  <span className="text-sm font-medium hidden md:block text-foreground">
                    {user.name}
                  </span>
                </div>
                <form action="/api/auth/logout" method="POST">
                  <button 
                    type="submit"
                    className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                    title="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Section */}
        <div className="mb-10 max-w-2xl mx-auto">
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
            </div>
            <form>
              <input
                type="text"
                name="q"
                defaultValue={q}
                placeholder="Search your thoughts..."
                className="block w-full rounded-full border border-border bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all shadow-sm"
              />
            </form>
          </div>
        </div>

        {/* Mobile FAB */}
        <Link
          href="/new"
          className="fixed bottom-6 right-6 sm:hidden h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/25 z-40 active:scale-95 transition-transform"
        >
          <Plus className="h-6 w-6" />
        </Link>

        {/* Notes Grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {notesList.map((note) => (
            <Link
              key={note.id}
              href={`/note/${note.id}`}
              className="group block bg-card backdrop-blur-md rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2 rounded-lg bg-muted group-hover:bg-primary/10 transition-colors">
                  <FileText className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
                {note.isPublic ? (
                  <div className="flex items-center px-2 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-medium border border-green-500/20">
                    <Globe className="h-3 w-3 mr-1" />
                    Public
                  </div>
                ) : (
                  <Lock className="h-4 w-4 text-muted-foreground/50" />
                )}
              </div>
              
              <h2 className="text-lg font-semibold text-foreground mb-2 line-clamp-1 group-hover:text-primary transition-colors">
                {note.title || "Untitled Note"}
              </h2>
              
              <p className="text-muted-foreground text-sm line-clamp-3 mb-4 leading-relaxed h-[4.5em]">
                {note.content || "No content..."}
              </p>
              
              <div className="flex items-center text-xs text-muted-foreground pt-4 border-t border-border/50">
                <Calendar className="h-3 w-3 mr-1.5" />
                <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Empty State */}
        {notesList.length === 0 && (
          <div className="text-center py-20">
            <div className="bg-muted h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">No notes found</h3>
            <p className="text-muted-foreground max-w-sm mx-auto mb-8">
              {q ? `We couldn't find anything matching "${q}".` : "Your digital garden is empty. Start planting some ideas."}
            </p>
            {!q && (
               <Link
                href="/new"
                className="inline-flex items-center px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium hover:opacity-90 transition-all"
              >
                <Plus className="h-5 w-5 mr-2" />
                Create First Note
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
