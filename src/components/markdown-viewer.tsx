"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css"; // Code block theme
import "github-markdown-css/github-markdown.css"; // Markdown body styles

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    // Configure marked to use highlight.js
    const renderer = new marked.Renderer();
    
    // Custom logic to handle code blocks with highlighting
    // Note: marked 4+ handles this differently, but we can use useEffect to highlight after render
    // or use marked-highlight if we wanted a plugin. For simplicity/robustness without plugins:
    
    async function parseMarkdown() {
        const rawHtml = await marked.parse(content, { async: true });
        
        // Sanitize
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        setHtml(cleanHtml);
    }

    parseMarkdown();
  }, [content]);

  // Apply syntax highlighting after HTML update
  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [html]);

  return (
    <div 
      className={`markdown-body ${className}`} 
      style={{ backgroundColor: 'transparent' }} // Override github-markdown-css bg
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
