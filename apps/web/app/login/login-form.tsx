"use client"

import { useState, useCallback, useEffect } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { SiweMessage } from "siwe"
import { useAccount, useConnect, useSignMessage } from "wagmi"
import { authClient } from "@/lib/auth-client"
import { Button, LinkButton } from "@workspace/ui/components/button"
import { WalletGuard } from "@/components/wallet-guard"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  WalletAdd01Icon,
  Store04Icon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { motion, AnimatePresence } from "framer-motion"
import { toast } from "sonner"

const roles = [
  {
    value: "tourist",
    label: "Tourist",
    description: "Exchange cash for USDC",
    icon: WalletAdd01Icon,
  },
  {
    value: "agent",
    label: "Agent",
    description: "Earn as a local agent",
    icon: Store04Icon,
  },
] as const

function useWalletAvailable() {
  const [available, setAvailable] = useState(true)
  useEffect(() => {
    const hasWallet = typeof window !== "undefined" && !!window.ethereum
    if (hasWallet !== available) {
      setAvailable(hasWallet)
    }
  }, [available])
  return available
}

function ConnectStep({
  isConnected,
  address,
  onConnect,
  onSignIn,
  loading,
  walletAvailable,
}: {
  isConnected: boolean
  address?: string
  onConnect: () => void
  onSignIn: () => void
  loading: boolean
  walletAvailable: boolean
}) {
  return (
    <AnimatePresence mode="wait">
      {!isConnected ? (
        <motion.div
          key="connect"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-4"
        >
          <Button
            onPress={onConnect}
            className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background hover:scale-[1.02] hover:bg-foreground/90"
          >
            Connect Wallet
          </Button>
          {!walletAvailable && (
            <p className="text-center text-xs text-muted-foreground">
              No wallet detected.
              {navigator?.userAgent?.includes("Brave")
                ? " Enable Brave Wallet in Settings > Wallet, or install MetaMask."
                : " Install MetaMask or enable your browser wallet."}
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="sign"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-5"
        >
          <div className="flex items-center justify-center gap-2 rounded-full border bg-secondary/50 px-4 py-2.5 font-mono text-sm">
            <span className="size-2 rounded-full bg-primary" />
            {address?.slice(0, 6)}...{address?.slice(-4)}
          </div>
          <Button
            onPress={onSignIn}
            isDisabled={loading}
            className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background hover:scale-[1.02] hover:bg-foreground/90"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="size-4 animate-spin rounded-full border-2 border-background border-t-transparent" />
                Signing...
              </span>
            ) : (
              "Sign In"
            )}
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const urlRole = searchParams.get("role")
  const defaultRole = urlRole === "agent" ? "agent" : "tourist"
  const [role, setRole] = useState<"tourist" | "agent">(defaultRole)

  const selectRole = (r: "tourist" | "agent") => {
    setRole(r)
    const params = new URLSearchParams(searchParams.toString())
    params.set("role", r)
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }
  const { data: session, isPending } = authClient.useSession()
  const { address, chainId, isConnected } = useAccount()
  const { connect, connectors, error: connectError } = useConnect()
  const { signMessageAsync } = useSignMessage()
  const walletAvailable = useWalletAvailable()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const connectWallet = useCallback(() => {
    const c = connectors[0]
    if (!c) {
      const msg = "No wallet detected. Install MetaMask or Rabby wallet."
      setError(msg)
      toast.error(msg)
      return
    }
    setError("")
    toast("Connecting wallet...", { icon: "🔄" })
    connect({ connector: c })
  }, [connect, connectors])

  useEffect(() => {
    if (isConnected && address) {
      toast.success("Wallet connected")
    }
  }, [isConnected, address])

  useEffect(() => {
    if (connectError) {
      toast.error(connectError.message || "Failed to connect wallet")
    }
  }, [connectError])

  const signIn = useCallback(async () => {
    if (!address) return
    try {
      setLoading(true)
      setError("")
      toast("Signing message...", { icon: "✍️" })

      const { data: nonceData, error: nonceErr } =
        await authClient.siwe.getNonce({
          walletAddress: address,
          chainId: chainId ?? 10143,
        })
      if (nonceErr || !nonceData)
        throw new Error(nonceErr?.message ?? "Failed to get nonce")

      const siweMessage = new SiweMessage({
        domain: window.location.host,
        address,
        statement: "Sign in to 0verice",
        uri: window.location.origin,
        version: "1",
        chainId: chainId ?? 10143,
        nonce: nonceData.nonce,
      })

      const message = siweMessage.prepareMessage()
      const signature = await signMessageAsync({ message })

      const { error: verifyErr } = await authClient.siwe.verify({
        message,
        signature,
        walletAddress: address,
        chainId: chainId ?? 10143,
      })
      if (verifyErr) throw new Error(verifyErr.message ?? "Verification failed")

      authClient.$store.notify("$sessionSignal")

      await fetch("/api/auth/set-role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      })

      toast.success("Signed in successfully")
      router.push(role === "agent" ? "/apps/agent" : "/apps/tourist")
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign in failed"
      setError(msg)
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [address, chainId, signMessageAsync, role, router])

  if (isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center px-5">
        <p className="animate-pulse text-sm text-muted-foreground">
          Loading...
        </p>
      </div>
    )
  }

  if (session) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center px-5 py-12">
        <div className="w-full max-w-sm">
          <div className="rounded-2xl border bg-card p-6 text-center overflow-hidden">
            <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                className="text-primary"
              >
                <path
                  d="M20 6L9 17L4 12"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold">Signed in</h2>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {session.user?.email ?? "Connected"}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border bg-secondary/50 px-4 py-2.5 font-mono text-xs">
              <span className="size-2 rounded-full bg-primary" />
              {address?.slice(0, 6)}...{address?.slice(-4)}
            </div>
            <Button
              onPress={async () => {
                await authClient.signOut()
                toast("Signed out")
              }}
              variant="outline"
              className="mt-6 h-12 w-full rounded-full"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col bg-background px-5 py-12 sm:items-center sm:justify-center sm:py-0">
      <main className="mx-auto w-full max-w-sm">
        <LinkButton
          href="/"
          variant="ghost"
          className="mb-8 h-auto rounded-full px-0 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </LinkButton>

        <h1 className="text-xl font-black tracking-tight sm:text-2xl">
          Join 0verice
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Choose your role to get started.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3" role="radiogroup" aria-label="Select your role">
          {roles.map((r) => {
            const selected = role === r.value
            return (
              <button
                key={r.value}
                role="radio"
                aria-checked={selected}
                onClick={() => selectRole(r.value)}
                className={`flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                  selected
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "border-border bg-card hover:bg-muted"
                }`}
              >
                <span
                  className={`flex size-10 items-center justify-center rounded-full ${
                    selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  <HugeiconsIcon icon={r.icon} size={20} />
                </span>
                <div>
                  <div className="text-sm font-semibold">{r.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.description}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        <div className="mt-8 rounded-xl border bg-card p-6">
          <WalletGuard>
            <ConnectStep
              isConnected={isConnected}
              address={address}
              onConnect={connectWallet}
              onSignIn={signIn}
              loading={loading}
              walletAvailable={walletAvailable}
            />
          </WalletGuard>

          {(error || connectError) && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-center text-sm text-destructive"
            >
              {error || connectError?.message || "Connection failed"}
            </motion.p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <a href="/terms" className="underline hover:text-foreground">
            Terms
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-foreground">
            Privacy Policy
          </a>
        </p>
      </main>
    </div>
  )
}
