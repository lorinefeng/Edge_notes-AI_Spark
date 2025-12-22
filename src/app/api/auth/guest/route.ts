import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { signSession } from "@/lib/auth";
import { nanoid } from "nanoid";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext();
    const secret = env.JWT_SECRET;
    
    // Attempt to get location from Cloudflare headers
    const city = req.headers.get("cf-ipcity") || "Unknown City";
    const country = req.headers.get("cf-ipcountry") || "Earth";
    const location = city !== "Unknown City" ? city : country;

    const guestId = `guest_${nanoid(10)}`;
    const guestName = `Visitor from ${location}`;

    const payload = {
      sub: guestId,
      name: guestName,
      role: "guest",
      avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${guestId}`, // Generate a default avatar
    };

    const token = await signSession(payload, secret);
    const cookieStore = await cookies();

    cookieStore.set("session", token, {
      httpOnly: true,
      secure: req.nextUrl.protocol === "https:",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ success: true, user: payload });
  } catch (e: any) {
    console.error("Guest login error:", e);
    return NextResponse.json({ error: "Failed to create guest session" }, { status: 500 });
  }
}
