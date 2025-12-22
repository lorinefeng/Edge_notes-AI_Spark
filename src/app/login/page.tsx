"use client";

import Link from "next/link";
import { Github, FileText, User } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleGuestLogin = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/guest", { method: "POST" });
      if (res.ok) {
        router.push("/");
        router.refresh();
      } else {
        console.error("Guest login failed");
        setLoading(false);
      }
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Decoration */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl opacity-30 animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl opacity-30 animate-pulse delay-1000" />
      </div>

      <div className="max-w-md w-full space-y-8 p-8 bg-card rounded-2xl shadow-xl shadow-black/10 border border-border relative z-10 mx-4">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground">
            Welcome Back
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to access your digital garden.
          </p>
        </div>
        
        <div className="mt-8 space-y-4">
          <Link
            href="/api/auth/login"
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm hover:shadow-md hover:border-primary/30"
          >
            <span className="absolute left-4 inset-y-0 flex items-center">
              <Github className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </span>
            <span>Sign in with GitHub</span>
          </Link>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue as</span>
            </div>
          </div>

          <button
            onClick={handleGuestLogin}
            disabled={loading}
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm hover:shadow-md hover:border-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="absolute left-4 inset-y-0 flex items-center">
              <User className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </span>
            <span>{loading ? "Creating Guest Session..." : "Guest Visitor"}</span>
          </button>
          
          <p className="text-center text-xs text-muted-foreground pt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
