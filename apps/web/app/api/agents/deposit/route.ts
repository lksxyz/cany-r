import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { agent as agentTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "agent") {
    return NextResponse.json(
      { error: "Only agents can deposit" },
      { status: 403 },
    )
  }

  const agentData = await db
    .select()
    .from(agentTable)
    .where(eq(agentTable.userId, session.user.id))
    .get()

  if (!agentData) {
    return NextResponse.json(
      { error: "Agent not registered" },
      { status: 400 },
    )
  }

  const { amount, txHash } = await req.json()

  if (!amount || amount <= 0) {
    return NextResponse.json(
      { error: "Invalid amount" },
      { status: 400 },
    )
  }

  await db
    .update(agentTable)
    .set({
      escrowBalance: agentData.escrowBalance + amount,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agentTable.id, agentData.id))

  return NextResponse.json({
    success: true,
    escrowBalance: agentData.escrowBalance + amount,
    txHash,
  })
}
