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
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white shadow-lg rounded-xl overflow-hidden">
        <div className="bg-gray-900 px-8 py-6">
          <h1 className="text-2xl font-bold text-white">{note.title}</h1>
          <p className="text-gray-400 text-sm mt-1">
            Published on {new Date(note.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="p-8">
          <div className="prose max-w-none font-mono whitespace-pre-wrap text-gray-800">
            {note.content}
          </div>
        </div>
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex justify-between items-center">
          <span className="text-sm text-gray-500">Edge Notes Share</span>
          <a href="/" className="text-sm font-medium text-blue-600 hover:text-blue-500">
            Create your own note &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}
