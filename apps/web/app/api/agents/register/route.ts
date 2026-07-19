import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { agent as agentTable } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { generateId } from "better-auth"

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const agentData = await db
    .select()
    .from(agentTable)
    .where(eq(agentTable.userId, session.user.id))
    .get()

  if (!agentData) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 })
  }

  return NextResponse.json(agentData)
}

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (session.user.role !== "agent") {
    return NextResponse.json(
      { error: "Only agents can register" },
      { status: 403 },
    )
  }

  const existing = await db
    .select()
    .from(agentTable)
    .where(eq(agentTable.userId, session.user.id))
    .get()

  if (existing) {
    return NextResponse.json(
      { error: "Agent already registered" },
      { status: 400 },
    )
  }

  const { fullName, address, currency } = await req.json()

  if (!fullName || !address || !currency) {
    return NextResponse.json(
      { error: "Missing fields: fullName, address, currency" },
      { status: 400 },
    )
  }

  const now = new Date().toISOString()
  const newAgent = {
    id: generateId(),
    userId: session.user.id,
    fullName,
    address,
    currency,
    country: "Indonesia",
    escrowBalance: 0,
    createdAt: now,
    updatedAt: now,
  }

  await db.insert(agentTable).values(newAgent)

  return NextResponse.json(newAgent, { status: 201 })
}
