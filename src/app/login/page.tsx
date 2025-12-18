import Link from "next/link";
import { Github, FileText } from "lucide-react";

export default function LoginPage() {
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
        
        <div className="mt-8 space-y-6">
          <Link
            href="/api/auth/login"
            className="group relative w-full flex justify-center items-center py-3 px-4 border border-border text-sm font-medium rounded-lg text-foreground bg-card hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all shadow-sm hover:shadow-md hover:border-primary/30"
          >
            <span className="absolute left-4 inset-y-0 flex items-center">
              <Github className="h-5 w-5 text-foreground/70 group-hover:text-foreground transition-colors" />
            </span>
            <span>Sign in with GitHub</span>
          </Link>
          
          <p className="text-center text-xs text-muted-foreground pt-4">
            By signing in, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}
