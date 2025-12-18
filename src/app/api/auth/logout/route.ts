import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", req.url));
  
  // Clear the session cookie
  response.cookies.delete("session");
  
  return response;
}
