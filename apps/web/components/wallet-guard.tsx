"use client"

import { useCallback } from "react"
import { useAccount, useSwitchChain } from "wagmi"
import { monadTestnet } from "@/lib/wallet"
import { Button } from "@workspace/ui/components/button"
import { toast } from "sonner"

export function WalletGuard({ children }: { children: React.ReactNode }) {
  const { chainId, isConnected } = useAccount()
  const { switchChain } = useSwitchChain()

  const handleSwitch = useCallback(async () => {
    try {
      await switchChain({ chainId: monadTestnet.id })
    } catch {
      toast.error("Failed to switch network. Please add Monad Testnet manually in your wallet settings.")
    }
  }, [switchChain])

  if (!isConnected) return <>{children}</>

  if (chainId && chainId !== monadTestnet.id) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">
          Wrong network detected
        </p>
        <p className="text-xs text-muted-foreground">
          Please switch to <strong>Monad Testnet</strong> (Chain ID:{" "}
          {monadTestnet.id}) to use 0verice.
        </p>
        <Button
          onPress={handleSwitch}
          className="h-10 rounded-full bg-destructive px-5 text-sm font-semibold text-destructive-foreground hover:bg-destructive/90"
        >
          Switch to Monad Testnet
        </Button>
      </div>
    )
  }

  return <>{children}</>
}
