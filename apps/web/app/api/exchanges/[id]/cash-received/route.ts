import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import { exchange, agent } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import { generateRandomString } from "better-auth/crypto"

const QR_EXPIRY_MINUTES = 5

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

  if (exch.status !== "accepted") {
    return NextResponse.json(
      { error: "Exchange must be accepted first" },
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

  const body = await req.json().catch(() => ({}))
  const { nonce, expiresAt, signature } = body

  if (nonce && expiresAt && signature) {
    // Step 2: store signature and finalize
    await db
      .update(exchange)
      .set({
        status: "cash_received",
        qrNonce: String(nonce),
        qrExpiresAt: expiresAt,
        qrSignature: signature,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(exchange.id, id))

    return NextResponse.json({
      success: true,
      nonce,
      expiresAt,
      signature,
    })
  }

  // Step 1: generate nonce + expiry for agent to sign
  const newNonce = generateRandomString(32, "a-z", "A-Z", "0-9")
  const newExpiresAt = new Date(
    Date.now() + QR_EXPIRY_MINUTES * 60 * 1000,
  ).toISOString()

  const qrPayload = JSON.stringify({
    exchangeId: id,
    nonce: newNonce,
    expiresAt: newExpiresAt,
  })

  return NextResponse.json({
    qrPayload,
    nonce: newNonce,
    expiresAt: newExpiresAt,
    needsSignature: true,
  })
}
