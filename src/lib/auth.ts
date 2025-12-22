import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { getCloudflareContext } from "@opennextjs/cloudflare";

const ALG = "HS256";

export async function signSession(payload: any, secret: string) {
  const secretKey = new TextEncoder().encode(secret);
  return new SignJWT(payload)
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey);
}

export async function verifySession(token: string, secret: string) {
  try {
    const secretKey = new TextEncoder().encode(secret);
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: [ALG],
    });
    return payload;
  } catch (e) {
    return null;
  }
}

export type UserRole = "user" | "guest" | "admin";

export type SessionUser = {
  sub: string;
  name: string;
  avatar_url?: string;
  role: UserRole;
};

export async function getCurrentUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;
  
  if (!token) return null;

  try {
    const { env } = await getCloudflareContext();
    const secret = env.JWT_SECRET || process.env.JWT_SECRET || "";
    if (!secret) return null;
    
    const payload = await verifySession(token, secret);
    if (!payload) return null;

    const name = payload.name as string;
    const sub = payload.sub as string;
    let role: UserRole = (payload.role as UserRole) || "user";

    // Admin Override
    if (name === "lorinefeng") {
      role = "admin";
    }

    return {
      sub,
      name,
      avatar_url: payload.avatar_url as string,
      role
    };
  } catch (e) {
    // Fallback for local dev if getCloudflareContext fails or other errors
    const secret = process.env.JWT_SECRET || "";
    if (!secret) return null;
    const payload = await verifySession(token, secret);
    if (!payload) return null;

    const name = payload.name as string;
    const sub = payload.sub as string;
    let role: UserRole = (payload.role as UserRole) || "user";

    if (name === "lorinefeng") {
      role = "admin";
    }

    return {
      sub,
      name,
      avatar_url: payload.avatar_url as string,
      role
    };
  }
}

export async function exchangeGithubCode(code: string, clientId: string, clientSecret: string) {
  const res = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });
  const data = await res.json() as { access_token?: string; error?: string };
  if (data.error || !data.access_token) {
    throw new Error(data.error || "Failed to exchange code");
  }
  return data.access_token;
}

export async function getGithubUser(accessToken: string) {
  const res = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "User-Agent": "Edge-Notes-App",
    },
  });
  if (!res.ok) throw new Error("Failed to fetch user");
  return await res.json() as { id: number; login: string; avatar_url: string };
}
