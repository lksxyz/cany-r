"use client"

import { useAccount } from "wagmi"
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard"
import { authClient } from "@/lib/auth-client"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { Logout01Icon } from "@hugeicons/core-free-icons"
import Image from "next/image"

export function DashboardHeader({
  role,
}: {
  role?: "tourist" | "agent"
}) {
  const { address } = useAccount()
  const { copy, copied } = useCopyToClipboard()
  const router = useRouter()

  return (
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-lg items-center justify-between gap-4 px-5 sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/apple-icon.png"
            alt="0verice"
            width={28}
            height={28}
            className="size-7 rounded-lg"
          />
          <div className="flex flex-col">
            <span className="text-sm font-semibold tracking-tight">
              0verice
            </span>
            {role && (
              <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                {role === "tourist" ? "Tourist" : "Agent"}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {address && (
            <button
              onClick={() => copy(address)}
              className="flex items-center gap-1.5 rounded-full border bg-secondary/50 px-3 py-1 font-mono text-xs text-muted-foreground transition-all hover:border-primary/20 hover:text-foreground active:scale-[0.97]"
            >
              <span className="size-1.5 rounded-full bg-primary" />
              {address.slice(0, 6)}...{address.slice(-4)}
              {copied && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className="text-primary">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          )}

          <Button
            variant="ghost"
            size="icon"
            className="size-8"
            aria-label="Sign out"
            onPress={async () => {
              await authClient.signOut()
              router.push("/login")
            }}
          >
            <HugeiconsIcon icon={Logout01Icon} size={16} />
          </Button>
        </div>
      </div>
    </header>
  )
}
