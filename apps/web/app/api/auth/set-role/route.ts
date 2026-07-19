import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { role } = await req.json()
  if (role !== "tourist" && role !== "agent") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 })
  }

  await auth.api.updateUser({
    body: { role },
    headers: await headers(),
  })

  return NextResponse.json({ success: true })
}
