import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { exchangeGithubCode, getGithubUser, signSession } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext();
  const code = req.nextUrl.searchParams.get("code");
  
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  try {
    const accessToken = await exchangeGithubCode(code, env.GITHUB_CLIENT_ID, env.GITHUB_CLIENT_SECRET);
    const user = await getGithubUser(accessToken);
    
    // Sign session with avatar_url
    const token = await signSession({ 
      sub: user.id.toString(), 
      name: user.login,
      avatar_url: user.avatar_url 
    }, env.JWT_SECRET);
    
    // Set cookie
    const response = NextResponse.redirect(new URL("/", req.url));
    response.cookies.set("session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    return response;
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
