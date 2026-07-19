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

  if (exch.status !== "cash_received") {
    return NextResponse.json(
      { error: "Exchange is not ready for scanning" },
      { status: 400 },
    )
  }

  if (exch.qrExpiresAt && new Date(exch.qrExpiresAt) < new Date()) {
    await db
      .update(exchange)
      .set({
        status: "expired",
        updatedAt: new Date().toISOString(),
      })
      .where(eq(exchange.id, id))

    return NextResponse.json(
      { error: "QR code has expired" },
      { status: 400 },
    )
  }

  if (!exch.qrNonce) {
    return NextResponse.json(
      { error: "No QR nonce found" },
      { status: 400 },
    )
  }

  if (exch.qrNonce === "used") {
    return NextResponse.json(
      { error: "QR code already used" },
      { status: 400 },
    )
  }

  const body = await req.json().catch(() => ({}))
  const { txHash } = body

  const IDR_PER_USDC = 15_000
  const usdcAmount = Math.ceil(exch.amount / IDR_PER_USDC)

  await db
    .update(agent)
    .set({
      escrowBalance: sql`${agent.escrowBalance} - ${usdcAmount}`,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(agent.id, exch.agentId))

  await db
    .update(exchange)
    .set({
      status: "completed",
      qrNonce: "used",
      txHash: txHash || null,
      updatedAt: new Date().toISOString(),
    })
    .where(eq(exchange.id, id))

  return NextResponse.json({
    success: true,
    exchangeId: id,
    amount: exch.amount,
    txHash,
  })
}
