import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { agent } from "@/lib/db/schema"
import { and, gte, eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const minBalance = Number(searchParams.get("minBalance")) || 0
  const currency = searchParams.get("currency") || "USD"

  const agents = await db
    .select({
      id: agent.id,
      userId: agent.userId,
      fullName: agent.fullName,
      address: agent.address,
      currency: agent.currency,
      escrowBalance: agent.escrowBalance,
    })
    .from(agent)
    .where(
      and(eq(agent.currency, currency), gte(agent.escrowBalance, minBalance)),
    )

  return NextResponse.json(agents)
}
