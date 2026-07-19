"use client"

import { useState, useEffect, useCallback } from "react"
import { useAccount, useReadContract } from "wagmi"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  CashbackIcon,
  QrCodeScanIcon,
  AlertCircleIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface Exchange {
  id: string
  touristId: string
  agentId: string
  amount: number
  currency: string
  status: string
  qrPayload?: string
  qrNonce?: string
  qrExpiresAt?: string
  createdAt: string
}

const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3"

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ name: "account", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "decimals",
    inputs: [],
    outputs: [{ name: "", type: "uint8" }],
    stateMutability: "view",
  },
] as const

const statusLabels: Record<string, string> = {
  requested: "Awaiting your response",
  accepted: "Cash handover pending",
  cash_received: "QR code active",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
}

const statusColor: Record<string, string> = {
  requested: "text-amber-600 dark:text-amber-400 font-semibold",
  accepted: "text-primary",
  cash_received: "text-primary font-semibold",
  completed: "text-green-600 dark:text-green-400",
  cancelled: "text-muted-foreground",
  expired: "text-destructive",
}

function QRDisplay({
  exch,
  onBack,
  onDone,
}: {
  exch: Exchange
  onBack: () => void
  onDone: () => void
}) {
  const [qrPayload] = useState(
    () =>
      exch.qrPayload ||
      JSON.stringify({
        exchangeId: exch.id,
        nonce: exch.qrNonce,
        expiresAt: exch.qrExpiresAt,
      }),
  )

  return (
    <div className="flex flex-col items-center px-5 py-12 text-center sm:px-6">
      <button
        onClick={onBack}
        className="mb-8 self-start flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        Back
      </button>

      <div className="mb-6 flex size-20 items-center justify-center rounded-full bg-primary/10">
        <HugeiconsIcon
          icon={QrCodeScanIcon}
          size={36}
          className="text-primary"
        />
      </div>

      <h2 className="text-lg font-bold tracking-tight">Show QR to Tourist</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Ask the tourist to scan this QR code to release USDC.
      </p>

      <div className="mt-8 flex size-56 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-card p-4">
        <div className="text-center">
          <div className="mb-2 text-3xl font-mono font-bold text-primary">
            QR
          </div>
          <div className="text-[10px] text-muted-foreground break-all font-mono">
            {qrPayload.slice(0, 32)}...
          </div>
          {exch.qrExpiresAt && (
            <div className="mt-2 text-[10px] text-destructive">
              Expires{" "}
              {new Date(exch.qrExpiresAt).toLocaleTimeString("en-ID", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          )}
        </div>
      </div>

      <p className="mt-4 text-xs text-muted-foreground">
        QR code is single-use and expires in 5 minutes.
      </p>

      <Button
        onPress={onDone}
        variant="outline"
        className="mt-6 h-12 w-full max-w-xs rounded-full text-sm"
      >
        Done
      </Button>
    </div>
  )
}

function ExchangeCard({
  exch,
  onAccept,
  onCashReceived,
  onShowQR,
  onCancel,
}: {
  exch: Exchange
  onAccept?: () => void
  onCashReceived?: () => void
  onShowQR?: () => void
  onCancel?: () => void
}) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">
            ${exch.amount} {exch.currency} → USDC
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {new Date(exch.createdAt).toLocaleDateString("en-ID", {
              month: "short",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>
        <span
          className={`rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColor[exch.status] || ""}`}
        >
          {statusLabels[exch.status] || exch.status}
        </span>
      </div>

      <div className="mt-3 flex gap-2">
        {exch.status === "requested" && onAccept && (
          <Button
            onPress={onAccept}
            className="h-9 flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            Accept
          </Button>
        )}
        {exch.status === "accepted" && onCashReceived && (
          <Button
            onPress={onCashReceived}
            className="h-9 flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            <HugeiconsIcon icon={CashbackIcon} size={14} />
            Cash Received
          </Button>
        )}
        {exch.status === "cash_received" && onShowQR && (
          <Button
            onPress={onShowQR}
            className="h-9 flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            <HugeiconsIcon icon={QrCodeScanIcon} size={14} />
            Show QR
          </Button>
        )}
        {["requested", "accepted"].includes(exch.status) && onCancel && (
          <Button
            onPress={onCancel}
            variant="outline"
            className="h-9 rounded-full text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

export default function AgentDashboard() {
  const { address } = useAccount()
  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })
  const { data: usdcDecimals } = useReadContract({
    address: USDC_ADDRESS,
    abi: ERC20_ABI,
    functionName: "decimals",
  })
  const usdcBalance =
    usdcBalanceRaw && usdcDecimals
      ? Number(usdcBalanceRaw) / 10 ** usdcDecimals
      : null

  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(true)
  const [showQR, setShowQR] = useState<Exchange | null>(null)
  const [balance, setBalance] = useState<number | null>(null)

  const fetchExchanges = useCallback(async () => {
    try {
      const res = await fetch("/api/exchanges")
      if (res.ok) {
        const data = await res.json()
        setExchanges(data)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchBalance = useCallback(async () => {
    try {
      const res = await fetch("/api/agents")
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setBalance(data[0].escrowBalance)
        }
      }
    } catch {
      // ignore
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchExchanges(), fetchBalance()])
    }
    load()
  }, [fetchExchanges, fetchBalance])

  const handleAccept = async (id: string) => {
    const res = await fetch(`/api/exchanges/${id}/accept`, { method: "POST" })
    if (res.ok) {
      toast.success("Exchange accepted")
      fetchExchanges()
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to accept")
    }
  }

  const handleCashReceived = async (id: string) => {
    const res = await fetch(`/api/exchanges/${id}/cash-received`, {
      method: "POST",
    })
    if (res.ok) {
      const data = await res.json()
      toast.success("QR code generated")
      fetchExchanges()
      // Navigate to QR view by finding the updated exchange
      const updated = exchanges.find((e) => e.id === id)
      if (updated) {
        setShowQR({ ...updated, qrPayload: data.qrPayload, qrNonce: data.nonce, qrExpiresAt: data.expiresAt })
      }
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to confirm cash")
    }
  }

  const handleCancel = async (id: string) => {
    const res = await fetch(`/api/exchanges/${id}/cancel`, { method: "POST" })
    if (res.ok) {
      toast.success("Exchange cancelled")
      fetchExchanges()
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to cancel")
    }
  }

  const requests = exchanges.filter((e) => e.status === "requested")
  const activeExchanges = exchanges.filter((e) =>
    ["accepted", "cash_received"].includes(e.status),
  )
  const historyExchanges = exchanges.filter((e) =>
    ["completed", "cancelled", "expired"].includes(e.status),
  )

  if (showQR) {
    return (
      <main className="mx-auto w-full max-w-lg">
        <QRDisplay
          exch={showQR}
          onBack={() => setShowQR(null)}
          onDone={() => {
            setShowQR(null)
            fetchExchanges()
          }}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg pb-8">
      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Wallet
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {usdcBalance !== null ? usdcBalance.toFixed(2) : "..."}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                USDC
              </span>
            </div>
          </div>
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Escrow
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {balance !== null ? `$${balance}` : "..."}{" "}
              <span className="text-sm font-normal text-muted-foreground">
                USDC
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Dashboard</h1>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 px-5 sm:px-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : (
        <>
          {requests.length > 0 && (
            <div className="mb-6">
              <h2 className="mb-3 px-5 text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 sm:px-6">
                Requests ({requests.length})
              </h2>
              <div className="space-y-3 px-5 sm:px-6">
                {requests.map((exch) => (
                  <ExchangeCard
                    key={exch.id}
                    exch={exch}
                    onAccept={() => handleAccept(exch.id)}
                    onCancel={() => handleCancel(exch.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {(activeExchanges.length > 0 || exchanges.length > 0 || requests.length > 0) && (
            <div className="mb-6">
              <h2 className="mb-3 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                Active
              </h2>
              {activeExchanges.length > 0 ? (
                <div className="space-y-3 px-5 sm:px-6">
                  {activeExchanges.map((exch) => (
                    <ExchangeCard
                      key={exch.id}
                      exch={exch}
                      onCashReceived={
                        exch.status === "accepted"
                          ? () => handleCashReceived(exch.id)
                          : undefined
                      }
                      onShowQR={
                        exch.status === "cash_received"
                          ? () => setShowQR(exch)
                          : undefined
                      }
                      onCancel={() => handleCancel(exch.id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center px-5 py-10 text-center sm:px-6">
                  <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
                    <HugeiconsIcon
                      icon={AlertCircleIcon}
                      size={18}
                      className="text-muted-foreground"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    No active exchanges
                  </p>
                </div>
              )}
            </div>
          )}

          {historyExchanges.length > 0 && (
            <div>
              <h2 className="mb-3 px-5 text-xs font-semibold uppercase tracking-wider text-muted-foreground sm:px-6">
                History
              </h2>
              <div className="space-y-2 px-5 sm:px-6">
                {historyExchanges.map((exch) => (
                  <div
                    key={exch.id}
                    className="flex items-center justify-between rounded-xl border bg-card/50 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      {exch.status === "completed" ? (
                        <HugeiconsIcon
                          icon={CheckmarkCircle02Icon}
                          size={16}
                          className="text-green-600 dark:text-green-400"
                        />
                      ) : (
                        <HugeiconsIcon
                          icon={Cancel01Icon}
                          size={16}
                          className="text-muted-foreground"
                        />
                      )}
                      <div>
                        <div className="text-sm">
                          ${exch.amount} {exch.currency}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(exch.createdAt).toLocaleDateString(
                            "en-ID",
                            { month: "short", day: "numeric" },
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] capitalize text-muted-foreground">
                      {exch.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {exchanges.length === 0 && requests.length === 0 && (
            <div className="flex flex-col items-center px-5 py-16 text-center sm:px-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={CashbackIcon}
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <p className="text-sm font-medium">No exchanges yet</p>
              <p className="mt-1 text-xs text-muted-foreground">
                When a tourist creates a request, it will appear here.
              </p>
            </div>
          )}
        </>
      )}
    </main>
  )
}
