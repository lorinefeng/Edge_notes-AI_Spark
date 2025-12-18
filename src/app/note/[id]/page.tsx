"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, Share2, Calendar, Edit2, Trash2, Loader2, Save, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { AIPolish } from "@/components/ai-polish";

// Client Component for interactivity
function NoteActions({ note }: { note: any }) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: note.title,
    content: note.content,
    isPublic: note.isPublic,
  });

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this note? This action cannot be undone.")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      router.push("/");
      router.refresh();
    } catch (e) {
      alert("Error deleting note");
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/notes/${note.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      
      if (!res.ok) throw new Error("Failed to update");
      
      setIsEditing(false);
      router.refresh();
    } catch (e) {
      alert("Error updating note");
    } finally {
      setLoading(false);
    }
  };

  if (isEditing) {
    return (
      <form onSubmit={handleUpdate} className="bg-card rounded-xl shadow-lg shadow-black/5 border border-border p-8 space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-foreground">Edit Note</h2>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="p-2 hover:bg-muted rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Title</label>
            <input
              type="text"
              required
              className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-2">Content</label>
            <textarea
              required
              rows={10}
              className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono text-sm leading-relaxed resize-y"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="flex items-center">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input text-primary focus:ring-primary/20 cursor-pointer"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
              />
              <span className="ml-2 text-sm text-foreground group-hover:text-primary transition-colors">
                Make this note public
              </span>
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-border/50">
          <div className="flex-1 flex justify-start">
            <AIPolish 
              currentContent={formData.content} 
              onApply={(newContent) => setFormData({ ...formData, content: newContent })} 
            />
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-lg shadow-primary/25 text-primary-foreground bg-primary hover:opacity-90 disabled:opacity-50 transition-all active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </button>
        </div>
      </form>
    );
  }

  return (
    <article className="bg-card rounded-xl shadow-lg shadow-black/5 border border-border overflow-hidden">
      {/* Article Header */}
      <div className="border-b border-border/50 bg-muted/30 p-8">
        <div className="flex justify-between items-start gap-4">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-4 leading-tight flex-1">
            {note.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsEditing(true)}
              className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
              title="Edit Note"
            >
              <Edit2 className="h-4 w-4" />
            </button>
            <button
              onClick={handleDelete}
              disabled={loading}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
              title="Delete Note"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          </div>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="h-4 w-4 mr-2 opacity-70" />
          <span>Created on {new Date(note.createdAt).toLocaleDateString(undefined, { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</span>
        </div>
      </div>

      {/* Article Body */}
      <div className="p-8">
        <div className="prose prose-slate dark:prose-invert max-w-none font-mono text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {note.content}
        </div>
      </div>
    </article>
  );
}

// Server Component Wrapper
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
