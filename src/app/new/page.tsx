"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save } from "lucide-react";

export default function NewNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublic: false,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error("Failed to create note");

      router.push("/");
      router.refresh();
    } catch (error) {
      alert("Error creating note");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center justify-between">
          <Link 
            href="/" 
            className="flex items-center text-muted-foreground hover:text-primary transition-colors font-medium"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Notes
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Create New Note</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 bg-card p-8 rounded-xl border border-border shadow-lg shadow-black/5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">Title</label>
            <input
              type="text"
              required
              placeholder="Give your note a title..."
              className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Content <span className="text-muted-foreground font-normal ml-1">(Markdown supported)</span>
            </label>
            <textarea
              required
              rows={12}
              placeholder="Write something amazing..."
              className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono text-sm leading-relaxed resize-y"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
            />
          </div>

          <div className="flex items-center pt-2">
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

          <div className="flex justify-end pt-4 border-t border-border/50">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2.5 border border-transparent text-sm font-medium rounded-full shadow-lg shadow-primary/25 text-primary-foreground bg-primary hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              {loading ? (
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Create Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
