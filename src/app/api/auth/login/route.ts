import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const clientId = env.GITHUB_CLIENT_ID;
  const redirectUri = new URL("/api/auth/callback", req.url).toString();
  
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user`;
  
  return NextResponse.redirect(url);
}
