import { NextRequest, NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  
  // Public paths
  if (
    path.startsWith("/_next") ||
    path.startsWith("/api/auth") ||
    path.startsWith("/share") ||
    path === "/login" ||
    path === "/favicon.ico" ||
    path.match(/\.(svg|png|jpg|jpeg|gif|webp)$/)
  ) {
    return NextResponse.next();
  }

  const sessionCookie = req.cookies.get("session")?.value;
  let secret = "";
  
  try {
     const { env } = await getCloudflareContext();
     secret = env.JWT_SECRET;
  } catch (e) {
     // Fallback if getCloudflareContext fails (e.g. local dev sometimes)
     secret = process.env.JWT_SECRET || "";
  }
  
  if (!sessionCookie) {
     return NextResponse.redirect(new URL("/login", req.url));
  }
  
  if (!secret) {
      // If secret is missing, we can't verify. For local dev, we might want to allow?
      // But better to fail safe.
      console.error("JWT_SECRET is missing");
      return NextResponse.redirect(new URL("/login", req.url));
  }

  const session = await verifySession(sessionCookie, secret);
  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-user-id", session.sub as string);
  requestHeaders.set("x-user-name", session.name as string);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
