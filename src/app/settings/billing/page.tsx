import { getCloudflareContext } from "@opennextjs/cloudflare";
import { drizzle } from "drizzle-orm/d1";
import { userQuotas } from "@/db/schema";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft, CreditCard, CheckCircle, Zap, Wallet } from "lucide-react";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export const runtime = "edge";

async function addCredits(formData: FormData) {
  "use server";
  const amount = parseInt(formData.get("amount") as string);
  const userId = formData.get("userId") as string;
  
  if (!amount || !userId) return;

  try {
    const { env } = await getCloudflareContext();
    const db = drizzle(env.DB);
    
    // Ensure user exists in quota table
    let quota = await db.select().from(userQuotas).where(eq(userQuotas.userId, userId)).get();
    if (!quota) {
        const today = new Date().toISOString().split("T")[0];
        await db.insert(userQuotas).values({
            userId,
            dailyCount: 0,
            lastResetDate: today,
            monthlyTokenUsage: 0,
            balance: amount,
            emailAlertSent: false,
        }).run();
    } else {
        await db.update(userQuotas)
        .set({ balance: quota.balance + amount })
        .where(eq(userQuotas.userId, userId))
        .run();
    }
    
    revalidatePath("/settings/billing");
  } catch (e) {
      console.error("Payment Error:", e);
  }
}

export default async function BillingPage() {
  const headerList = await headers();
  const userId = headerList.get("x-user-id");
  const userName = headerList.get("x-user-name");
  
  if (!userId) redirect("/login");

  const { env } = await getCloudflareContext();
  const db = drizzle(env.DB);
  let quota = await db.select().from(userQuotas).where(eq(userQuotas.userId, userId)).get();
  
  if (!quota) {
     quota = { dailyCount: 0, balance: 0, monthlyTokenUsage: 0 } as any;
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex items-center">
          <Link 
            href="/" 
            className="flex items-center text-muted-foreground hover:text-primary transition-colors font-medium group"
          >
            <div className="p-1.5 rounded-full bg-muted group-hover:bg-primary/10 mr-2 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </div>
            Back to Notes
          </Link>
        </div>

        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Billing & Usage</h1>
                <p className="text-muted-foreground">Manage your AI credits and view your usage statistics.</p>
            </div>

            {/* Usage Card */}
            <div className="grid gap-6 md:grid-cols-2">
                <div className="bg-card rounded-xl shadow-lg shadow-black/5 border border-border p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Zap className="h-24 w-24" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Zap className="h-5 w-5 mr-2 text-yellow-500" />
                        Daily Free Quota
                    </h2>
                    <div className="text-4xl font-bold text-foreground mb-2">
                        {5 - (quota?.dailyCount || 0)} / 5
                    </div>
                    <p className="text-sm text-muted-foreground">Free generations remaining today</p>
                    <div className="mt-4 w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div 
                            className="bg-yellow-500 h-full transition-all duration-500" 
                            style={{ width: `${Math.min(((quota?.dailyCount || 0) / 5) * 100, 100)}%` }}
                        />
                    </div>
                </div>

                <div className="bg-card rounded-xl shadow-lg shadow-black/5 border border-border p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Wallet className="h-24 w-24" />
                    </div>
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                        <Wallet className="h-5 w-5 mr-2 text-purple-500" />
                        Credit Balance
                    </h2>
                    <div className="text-4xl font-bold text-foreground mb-2">
                        {quota?.balance || 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Paid credits available</p>
                    <div className="mt-4 text-xs text-muted-foreground">
                        Total usage: {(quota?.monthlyTokenUsage || 0).toLocaleString()} tokens this month
                    </div>
                </div>
            </div>

            {/* Top Up Section */}
            <div className="bg-card rounded-xl shadow-lg shadow-black/5 border border-border p-8">
                <h2 className="text-xl font-bold text-foreground mb-6 flex items-center">
                    <CreditCard className="h-6 w-6 mr-3 text-green-600" />
                    Top Up Credits
                </h2>
                
                <div className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <p className="text-foreground leading-relaxed">
                            Need more than 5 polishes a day? Purchase additional credits to continue using AI features without limits.
                        </p>
                        <div className="p-4 bg-muted/50 rounded-lg border border-border">
                            <h3 className="font-medium text-foreground mb-2">Pricing</h3>
                            <ul className="space-y-2 text-sm text-muted-foreground">
                                <li className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    1 CNY per extra generation
                                </li>
                                <li className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                    Credits never expire
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="flex flex-col items-center p-6 bg-white rounded-xl border border-border">
                         <div className="w-48 h-48 bg-gray-100 rounded-lg flex items-center justify-center mb-4 text-center p-4">
                            {/* Placeholder for QR Code */}
                            <div className="space-y-2">
                                <div className="w-32 h-32 mx-auto bg-black/10 rounded flex items-center justify-center text-xs text-muted-foreground">
                                    [WeChat Pay QR]
                                </div>
                                <p className="text-xs text-muted-foreground">Scan to Pay</p>
                            </div>
                         </div>
                         
                         <form action={addCredits} className="w-full space-y-3">
                             <input type="hidden" name="userId" value={userId} />
                             <div className="grid grid-cols-3 gap-2">
                                {[10, 50, 100].map((amt) => (
                                    <button
                                        key={amt}
                                        name="amount"
                                        value={amt}
                                        className="px-3 py-2 text-sm font-medium border border-input rounded-md hover:bg-muted hover:text-primary transition-colors focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        ¥{amt}
                                    </button>
                                ))}
                             </div>
                             <p className="text-xs text-center text-muted-foreground mt-2">
                                 * This is a demo. Clicking above simulates payment.
                             </p>
                         </form>
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
