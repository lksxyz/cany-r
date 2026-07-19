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

  if (exch.status !== "requested") {
    return NextResponse.json(
      { error: "Exchange is not in requested status" },
      { status: 400 },
    )
  }

  const agentData = await db
    .select()
    .from(agent)
    .where(eq(agent.id, exch.agentId))
    .get()

  if (!agentData || agentData.userId !== session.user.id) {
    return NextResponse.json(
      { error: "You are not the assigned agent" },
      { status: 403 },
    )
  }

  if (agentData.escrowBalance < exch.amount) {
    return NextResponse.json(
      { error: "Insufficient escrow balance" },
      { status: 400 },
    )
  }

  await db
    .update(exchange)
    .set({ status: "accepted", updatedAt: new Date().toISOString() })
    .where(eq(exchange.id, id))

  await db
    .update(agent)
    .set({
      escrowBalance: sql`${agent.escrowBalance} - ${exch.amount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agent.id, exch.agentId))

  return NextResponse.json({ success: true })
}
