"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Save, Paperclip } from "lucide-react";
import { useFileUpload } from "@/hooks/use-file-upload";

export default function NewNotePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { uploadFile, isUploading } = useFileUpload();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    isPublic: false,
  });

  const insertAtCursor = (text: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    const newValue = value.substring(0, start) + text + value.substring(end);
    setFormData(prev => ({ ...prev, content: newValue }));
    
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + text.length, start + text.length);
    }, 0);
  };

  const handleUpload = async (file: File) => {
    const id = Math.random().toString(36).substring(7);
    const placeholder = `![Uploading ${file.name}...](${id})`;
    insertAtCursor(placeholder);
    
    const markdown = await uploadFile(file);
    if (markdown) {
      setFormData(prev => ({
        ...prev,
        content: prev.content.replace(placeholder, markdown)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        content: prev.content.replace(placeholder, "[Upload Failed]")
      }));
    }
  };

  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          await handleUpload(file);
        }
      }
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await handleUpload(files[0]);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleUpload(e.target.files[0]);
      e.target.value = "";
    }
  };

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
            <div className="relative group">
              <textarea
                ref={textareaRef}
                required
                rows={12}
                placeholder="Write something amazing..."
                className="block w-full rounded-lg border border-input bg-background/50 px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none font-mono text-sm leading-relaxed resize-y"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                onPaste={handlePaste}
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2 transition-opacity">
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileSelect}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="p-1.5 bg-background/80 hover:bg-muted rounded-md text-muted-foreground hover:text-primary transition-colors border border-border/50 shadow-sm backdrop-blur-sm"
                  title="Attach file"
                >
                  {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
                </button>
              </div>
            </div>
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
