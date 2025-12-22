"use client";

import { useState, useEffect } from "react";
import { Heart, MessageSquare, Eye, Send, Trash2, User as UserIcon } from "lucide-react";
import { useRouter } from "next/navigation";

interface Comment {
  id: number;
  guestName: string;
  content: string;
  createdAt: string;
  isAnonymous: boolean;
  userId?: string;
}

interface Visitor {
  visitorHash: string;
  location?: string;
}

interface SocialProps {
  slug: string;
  initialLikeCount: number;
  initialViewCount: number;
  initialComments: Comment[];
  initialVisitors: Visitor[]; // Just hashes or names for now
  initialIsLiked?: boolean;
  currentUser: any; // { role: 'admin' | 'user' | 'guest', sub: string, name: string } | null
}

export function SocialInteractions({
  slug,
  initialLikeCount,
  initialViewCount,
  initialComments,
  initialVisitors,
  initialIsLiked = false,
  currentUser,
}: SocialProps) {
  const [likes, setLikes] = useState(initialLikeCount);
  const [views, setViews] = useState(initialViewCount);
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [visitors, setVisitors] = useState<Visitor[]>(initialVisitors);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [commentText, setCommentText] = useState("");
  const [loadingComment, setLoadingComment] = useState(false);
  const router = useRouter();

  // 1. Record View on Mount
  useEffect(() => {
    const recordView = async () => {
      try {
        await fetch(`/api/public/notes/${slug}/view`, { method: "POST" });
        // Optimistically increment view count to show liveliness
        setViews(v => v + 1); 
      } catch (e) {
        console.error(e);
      }
    };
    recordView();
  }, [slug]);

  // 2. Handle Like
  const handleLike = async () => {
    // Optimistic update
    const newLikedState = !isLiked;
    setIsLiked(newLikedState);
    setLikes((prev) => (newLikedState ? prev + 1 : Math.max(0, prev - 1)));

    try {
      const res = await fetch(`/api/public/notes/${slug}/like`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setLikes(data.count);
        setIsLiked(data.liked);
      } else {
        // Revert
        setIsLiked(!newLikedState);
        setLikes((prev) => (!newLikedState ? prev + 1 : Math.max(0, prev - 1)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Handle Comment
  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    setLoadingComment(true);
    try {
      const res = await fetch(`/api/public/notes/${slug}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: commentText }),
      });
      const newComment = await res.json();
      if (res.ok) {
        setComments([newComment, ...comments]);
        setCommentText("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingComment(false);
    }
  };

  // 4. Handle Delete (Admin)
  const handleDeleteComment = async (id: number) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;
    try {
      const res = await fetch(`/api/admin/comments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setComments(comments.filter((c) => c.id !== id));
      } else {
        alert("Failed to delete");
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="mt-12 p-6 sm:p-8 rounded-2xl bg-card/80 backdrop-blur-md border border-border shadow-lg space-y-8">
      {/* Stats Bar */}
      <div className="flex items-center justify-between border-y border-border/50 py-4">
        <div className="flex items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5" />
            <span className="font-mono text-sm">{views} Views</span>
          </div>
          <button
            onClick={handleLike}
            className={`flex items-center gap-2 transition-colors ${
              isLiked ? "text-red-500" : "hover:text-red-500/70"
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
            <span className="font-mono text-sm">{likes} Likes</span>
          </button>
        </div>
        
        {/* Visitors (Simplified) */}
        <div className="flex items-center -space-x-2">
           {visitors.map((v, i) => (
             <div key={i} className="w-8 h-8 rounded-full bg-muted border-2 border-background flex items-center justify-center overflow-hidden" title={v.location || "Visitor"}>
                {/* Generate Avatar based on hash or just use icon */}
                <img 
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${v.visitorHash}`} 
                  alt="Visitor" 
                  className="w-full h-full object-cover"
                />
             </div>
           ))}
           {visitors.length > 0 && (
             <span className="text-xs text-muted-foreground ml-4">Recent Visitors</span>
           )}
        </div>
      </div>

      {/* Comments Section */}
      <div className="space-y-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Comments ({comments.length})
        </h3>

        {/* Comment Form */}
        <form onSubmit={handleComment} className="relative">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={currentUser ? "Write a thought..." : "Write a thought as Guest..."}
            className="w-full bg-muted/30 border border-border rounded-xl p-4 pr-12 min-h-[100px] focus:ring-2 focus:ring-primary/50 focus:outline-none resize-none"
          />
          <button
            type="submit"
            disabled={loadingComment || !commentText.trim()}
            className="absolute bottom-4 right-4 p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Comment List */}
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="group flex gap-4 p-4 rounded-xl hover:bg-muted/20 transition-colors border border-transparent hover:border-border/50">
              <div className="flex-shrink-0">
                <img
                  src={`https://api.dicebear.com/7.x/initials/svg?seed=${comment.userId || comment.guestName}`}
                  alt={comment.guestName}
                  className="w-10 h-10 rounded-full bg-muted"
                />
              </div>
              <div className="flex-grow space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{comment.guestName}</span>
                    {comment.isAnonymous && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">Guest</span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  {currentUser?.role === "admin" && (
                    <button
                      onClick={() => handleDeleteComment(comment.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-500/10 rounded transition-all"
                      title="Delete Comment"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                  {comment.content}
                </p>
              </div>
            </div>
          ))}
          
          {comments.length === 0 && (
            <div className="text-center py-10 text-muted-foreground italic">
              No thoughts yet. Be the first to share!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
