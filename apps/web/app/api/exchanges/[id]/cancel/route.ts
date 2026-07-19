import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { exchange, agent } from "@/lib/db/schema"
import { eq, sql } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const exch = await db
    .select()
    .from(exchange)
    .where(eq(exchange.id, id))
    .get()

  if (!exch) {
    return NextResponse.json({ error: "Exchange not found" }, { status: 404 })
  }

  if (exch.touristId !== session.user.id && exch.agentId !== session.user.id) {
    return NextResponse.json(
      { error: "You are not part of this exchange" },
      { status: 403 },
    )
  }

  if (["completed", "cancelled", "expired"].includes(exch.status)) {
    return NextResponse.json(
      { error: "Exchange already finished" },
      { status: 400 },
    )
  }

  // Refund escrow if it was deducted
  if (exch.status === "accepted" || exch.status === "cash_received") {
    await db
      .update(agent)
      .set({
        escrowBalance: sql`${agent.escrowBalance} + ${exch.amount}`,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(agent.id, exch.agentId))
  }

  await db
    .update(exchange)
    .set({ status: "cancelled", updatedAt: new Date().toISOString() })
    .where(eq(exchange.id, id))

  return NextResponse.json({ success: true })
}
