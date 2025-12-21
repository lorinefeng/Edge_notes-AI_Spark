import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { nanoid } from "nanoid";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = new URL("/api/auth/callback", req.url).toString();
  const state = nanoid();
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user&state=${state}`;
  
  const response = NextResponse.redirect(url);
  response.cookies.set("oauth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || req.url.startsWith("https"),
    path: "/",
    maxAge: 60 * 10, // 10 minutes
    sameSite: "lax",
  });
  
  return response;
}
