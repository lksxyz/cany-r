import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { exchange } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
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

  if (exch.agentId !== session.user.id) {
    return NextResponse.json(
      { error: "Only the assigned agent can acknowledge" },
      { status: 403 },
    )
  }

  if (exch.status !== "cash_received") {
    return NextResponse.json(
      { error: "Exchange is not in cash_received status" },
      { status: 400 },
    )
  }

  await db
    .update(exchange)
    .set({
      status: "completed",
      qrNonce: "used",
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exchange.id, id))

  return NextResponse.json({ success: true, exchangeId: id })
}
