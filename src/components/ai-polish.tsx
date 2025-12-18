"use client";

import { useState } from "react";
import { Sparkles, Loader2, Check, X, ArrowRight, Wand2 } from "lucide-react";
import * as Diff from "diff";
import { useRouter } from "next/navigation";

interface AIPolishProps {
  currentContent: string;
  onApply: (newContent: string) => void;
}

export function AIPolish({ currentContent, onApply }: AIPolishProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [style, setStyle] = useState("concise");
  const [customInstruction, setCustomInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  const handlePolish = async () => {
    if (!currentContent.trim()) {
      alert("Please enter some content first.");
      return;
    }
    
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/ai/polish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: currentContent, style, customInstruction }),
      });

      if (res.status === 402) {
        if (confirm("Daily free quota exceeded. Would you like to top up credits?")) {
           router.push("/settings/billing");
           setIsOpen(false);
        }
        return;
      }
      
      if (!res.ok) {
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
           const err = await res.json();
           throw new Error(err.error || "Failed to polish");
        } else {
           const text = await res.text();
           throw new Error(`Server Error: ${text.slice(0, 50)}...`);
        }
      }
      
      const data = await res.json();
      setResult(data.polishedContent);
    } catch (e: any) {
      alert(e.message || "Error polishing note");
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (result) {
      onApply(result);
      setIsOpen(false);
      setResult(null);
    }
  };

  const renderDiff = () => {
    if (!result) return null;
    const diff = Diff.diffWords(currentContent, result);
    
    return (
      <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed p-4 bg-muted/30 rounded-lg border border-border max-h-[60vh] overflow-y-auto">
        {diff.map((part, i) => {
          const color = part.added ? "bg-green-500/20 text-green-700 dark:text-green-300 px-0.5 rounded" :
                        part.removed ? "bg-red-500/20 text-red-700 dark:text-red-300 line-through px-0.5 rounded opacity-70" : 
                        "text-foreground opacity-90";
          return <span key={i} className={color}>{part.value}</span>;
        })}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all transform hover:scale-105"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        AI Polish
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-border">
        {/* Header */}
        <div className="p-6 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400">
              <Wand2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">AI Polish</h3>
              <p className="text-sm text-muted-foreground">Enhance your writing with AI</p>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex-1 overflow-y-auto">
          {!result ? (
            <div className="space-y-6">
               <div>
                 <label className="block text-sm font-medium text-foreground mb-2">Choose Style</label>
                 <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {['concise', 'academic', 'colloquial', 'formal', 'custom'].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStyle(s)}
                        className={`px-3 py-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                          style === s 
                            ? "border-purple-600 bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-300 ring-1 ring-purple-600" 
                            : "border-input hover:bg-muted/50 text-foreground"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                 </div>
                 
                 {style === 'custom' && (
                   <div className="mt-3">
                     <textarea
                       value={customInstruction}
                       onChange={(e) => setCustomInstruction(e.target.value)}
                       placeholder="Enter your custom polishing instructions (e.g., 'Make it sound like a pirate' or 'Focus on fixing grammar only')"
                       className="w-full px-3 py-2 text-sm border border-input rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-purple-500/50 min-h-[80px]"
                     />
                   </div>
                 )}
               </div>

               <div className="p-4 bg-muted/30 rounded-lg border border-border">
                  <p className="text-sm text-muted-foreground font-mono whitespace-pre-wrap line-clamp-[10]">
                    {currentContent || "(No content to polish)"}
                  </p>
               </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-muted-foreground">Diff View</span>
                <div className="flex gap-4 text-xs">
                   <span className="flex items-center text-red-500"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5"/>Removed</span>
                   <span className="flex items-center text-green-500"><span className="w-2 h-2 rounded-full bg-green-500 mr-1.5"/>Added</span>
                </div>
              </div>
              {renderDiff()}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex justify-end gap-3 bg-muted/10">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
          
          {!result ? (
            <button
              type="button"
              onClick={handlePolish}
              disabled={loading || !currentContent}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition-all"
            >
              {loading ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Generate Polish
            </button>
          ) : (
            <>
              <button
                 type="button"
                 onClick={() => setResult(null)}
                 className="px-4 py-2 text-sm font-medium text-foreground border border-input rounded-full hover:bg-muted transition-colors"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 transition-all"
              >
                <Check className="h-4 w-4 mr-2" />
                Apply Changes
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
