import { auth } from "@/lib/auth"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { DashboardHeader } from "@/components/dashboard-header"
import { WalletGuard } from "@/components/wallet-guard"

export default async function AppsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth.api.getSession({ headers: await headers() })

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <DashboardHeader role={session.user.role as "tourist" | "agent"} />
      <div className="flex-1">
        <WalletGuard>{children}</WalletGuard>
      </div>
    </div>
  )
}
