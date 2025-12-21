import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  
  // Clear the session cookie forcefully
  response.cookies.set("session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.url.startsWith("https"),
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  });
  
  return response;
}
