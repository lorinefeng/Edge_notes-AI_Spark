import Link from "next/link";
import { Plus, Search, Globe, Lock } from "lucide-react";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { notes } from "@/db/schema";
import { desc, eq, like, or, and } from "drizzle-orm";
import { headers } from "next/headers";

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
  const notesList = await getNotes(q);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">My Notes</h1>
        <Link
          href="/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          New Note
        </Link>
      </div>

      <div className="mb-6">
        <form className="relative">
          <input
            type="text"
            name="q"
            defaultValue={q}
            placeholder="Search notes..."
            className="block w-full rounded-md border border-gray-300 pl-10 pr-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
        </form>
      </div>

      <div className="grid gap-4">
        {notesList.map((note) => (
          <Link
            key={note.id}
            href={`/note/${note.id}`}
            className="block bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-xl font-semibold text-gray-900 truncate">
                {note.title}
              </h2>
              {note.isPublic ? (
                <Globe className="h-4 w-4 text-green-500" />
              ) : (
                <Lock className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="text-gray-600 line-clamp-2 text-sm font-mono">
              {note.content}
            </p>
            <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
              <span>{new Date(note.createdAt).toLocaleDateString()}</span>
              {note.isPublic && (
                <span className="text-blue-600">
                  Public
                </span>
              )}
            </div>
          </Link>
        ))}
        {notesList.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No notes found. Create one to get started!
          </div>
        )}
      </div>
    </div>
  );
}
