"use client";

import { useEffect, useState } from "react";
import { marked } from "marked";
import DOMPurify from "dompurify";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import json from "highlight.js/lib/languages/json";
import sql from "highlight.js/lib/languages/sql";
import css from "highlight.js/lib/languages/css";
import xml from "highlight.js/lib/languages/xml"; // Handles HTML
import "highlight.js/styles/github-dark.css";
import "github-markdown-css/github-markdown.css";

// Register only common languages to save bundle size (crucial for Cloudflare Workers limit)
hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("python", python);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("json", json);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("css", css);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("html", xml);

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

export function MarkdownViewer({ content, className = "" }: MarkdownViewerProps) {
  const [html, setHtml] = useState("");

  useEffect(() => {
    async function parseMarkdown() {
        const rawHtml = await marked.parse(content, { async: true });
        const cleanHtml = DOMPurify.sanitize(rawHtml);
        setHtml(cleanHtml);
    }

    parseMarkdown();
  }, [content]);

  useEffect(() => {
    document.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [html]);

  return (
    <div 
      className={`markdown-body ${className}`} 
      style={{ backgroundColor: 'transparent' }} 
      dangerouslySetInnerHTML={{ __html: html }} 
    />
  );
}
