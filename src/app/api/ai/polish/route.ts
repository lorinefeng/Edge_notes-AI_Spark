import { NextRequest, NextResponse } from "next/server";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { userQuotas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { polishNote, PolishStyle } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = user.sub;

  try {
    const { content, style, customInstruction } = await req.json();
    if (!content || !style) {
      return NextResponse.json({ error: "Missing content or style" }, { status: 400 });
    }

    const { env } = await getCloudflareContext();
    if (!env.DB) throw new Error("Database binding (DB) is missing in environment variables");
    if (!env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is missing in environment variables");

    const db = drizzle(env.DB);
    
    // Get or Create Quota
    let quota = await db.select().from(userQuotas).where(eq(userQuotas.userId, userId)).get();
    const today = new Date().toISOString().split("T")[0];

    if (!quota) {
      quota = await db.insert(userQuotas).values({
        userId,
        dailyCount: 0,
        lastResetDate: today,
        monthlyTokenUsage: 0,
        balance: 0,
        emailAlertSent: false,
      }).returning().get();
    }

    // Reset daily quota if new day
    if (quota.lastResetDate !== today) {
      quota = await db.update(userQuotas)
        .set({ dailyCount: 0, lastResetDate: today })
        .where(eq(userQuotas.userId, userId))
        .returning()
        .get();
    }

    // Check limits
    let useBalance = false;
    if (quota.dailyCount >= 5) {
      if (quota.balance >= 1) {
        useBalance = true;
      } else {
        return NextResponse.json({ 
          error: "Daily limit reached", 
          requiresPayment: true 
        }, { status: 402 });
      }
    }

    // Call AI
    try {
      const { polishedContent, usage } = await polishNote(
        content,
        style as PolishStyle,
        env.ANTHROPIC_API_KEY,
        env.ANTHROPIC_BASE_URL || "https://api.minimaxi.com/anthropic",
        env.ANTHROPIC_MODEL || "MiniMax-M2",
        customInstruction
      );

      // Update Usage
      const totalTokens = usage.input_tokens + usage.output_tokens;
      await db.update(userQuotas)
        .set({
          dailyCount: useBalance ? quota.dailyCount : quota.dailyCount + 1,
          balance: useBalance ? quota.balance - 1 : quota.balance,
          monthlyTokenUsage: quota.monthlyTokenUsage + totalTokens,
        })
        .where(eq(userQuotas.userId, userId))
        .run();
        
      // Mock Email Alert Logic
      const TOKEN_THRESHOLD = 1000000; // 1M tokens
      if (quota.monthlyTokenUsage + totalTokens > TOKEN_THRESHOLD && !quota.emailAlertSent) {
        console.warn(`[Alert] User ${userId} exceeded ${TOKEN_THRESHOLD} tokens. Sending email...`);
        await db.update(userQuotas)
          .set({ emailAlertSent: true })
          .where(eq(userQuotas.userId, userId))
          .run();
      }

      return NextResponse.json({ polishedContent });
    } catch (aiError: any) {
       console.error("AI Service Error:", aiError);
       // Sanitize error message in production
       const message = process.env.NODE_ENV === "production" 
         ? "AI Service temporarily unavailable. Please try again." 
         : `AI Service Failed: ${aiError.message}`;
       return NextResponse.json({ error: message }, { status: 502 });
    }

  } catch (e: any) {
    console.error("Polish Route Critical Error:", e);
    // Sanitize error message in production
    const message = process.env.NODE_ENV === "production" 
      ? "Internal Server Error" 
      : e.message || "Internal Server Error";
      
    return new NextResponse(
      JSON.stringify({ error: message }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
