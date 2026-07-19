import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { exchange, agent } from "@/lib/db/schema"
import { eq, and, or, desc } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { generateId } from "better-auth"

export async function GET(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get("status")

  const agentRecord = await db
    .select({ id: agent.id })
    .from(agent)
    .where(eq(agent.userId, session.user.id))
    .get()

  const conditions = [eq(exchange.touristId, session.user.id)]
  if (agentRecord) {
    conditions.push(eq(exchange.agentId, agentRecord.id))
  }

  if (status) {
    conditions.push(eq(exchange.status, status))
  }

  const exchanges = await db
    .select()
    .from(exchange)
    .where(or(...conditions))
    .orderBy(desc(exchange.createdAt))

  return NextResponse.json(exchanges)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "tourist") {
    return NextResponse.json(
      { error: "Only tourists can create exchanges" },
      { status: 403 },
    )
  }

  const { agentId, amount, currency } = await req.json()

  if (!agentId || !amount || !currency) {
    return NextResponse.json(
      { error: "Missing required fields: agentId, amount, currency" },
      { status: 400 },
    )
  }

  const agentData = await db
    .select()
    .from(agent)
    .where(eq(agent.id, agentId))
    .get()

  if (!agentData) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  const IDR_PER_USDC = 15_000
  const usdcAmount = Math.ceil(amount / IDR_PER_USDC)

  if (agentData.escrowBalance < usdcAmount) {
    return NextResponse.json(
      { error: "Agent does not have enough escrow balance" },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const newExchange = {
    id: generateId(),
    touristId: session.user.id,
    agentId,
    amount,
    currency,
    status: "requested" as const,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(exchange).values(newExchange)

  return NextResponse.json(newExchange, { status: 201 })
}
