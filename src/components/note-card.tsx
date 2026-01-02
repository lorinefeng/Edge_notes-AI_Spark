"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { FileText, Globe, Lock, Calendar } from "lucide-react";
import { Loader } from "./loader";

interface NoteCardProps {
    note: {
        id: number;
        title: string | null;
        content: string | null;
        isPublic: boolean;
        createdAt: Date;
        authorName?: string | null;
    };
    isGuest: boolean;
}

export function NoteCard({ note, isGuest }: NoteCardProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isClicked, setIsClicked] = useState(false);

    const isLoading = isPending || isClicked;

    const handleClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isLoading) return; // Prevent multiple clicks

        setIsClicked(true);
        startTransition(() => {
            router.push(`/note/${note.id}`);
        });
    };

    return (
        <div
            onClick={handleClick}
            className="group relative block bg-card backdrop-blur-md rounded-xl border border-border p-6 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
            {/* Loading Overlay */}
            {isLoading && (
                <div className="card-loading-overlay">
                    <Loader size="sm" />
                </div>
            )}

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

            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t border-border/50">
                <div className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1.5" />
                    <span>{new Date(note.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                {isGuest && note.authorName && (
                    <span className="italic text-primary/70">{note.authorName}</span>
                )}
            </div>
        </div>
    );
}
