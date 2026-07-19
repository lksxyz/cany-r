"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  WalletAdd01Icon,
  CheckmarkCircle02Icon,
  Cancel01Icon,
  QrCodeScanIcon,
  ArrowLeft01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"

interface Agent {
  id: string
  fullName: string
  address: string
  escrowBalance: number
}

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

type View = "active" | "new" | "scan" | "history"

const statusLabels: Record<string, string> = {
  requested: "Waiting for agent",
  accepted: "Agent accepted, meet in person",
  cash_received: "Scan QR to complete",
  completed: "Completed",
  cancelled: "Cancelled",
  expired: "Expired",
}

const statusColor: Record<string, string> = {
  requested: "text-muted-foreground",
  accepted: "text-primary",
  cash_received: "text-primary font-semibold",
  completed: "text-green-600 dark:text-green-400",
  cancelled: "text-muted-foreground",
  expired: "text-destructive",
}

function NewExchangeForm({
  onBack,
  onCreated,
}: {
  onBack: () => void
  onCreated: () => void
}) {
  const [amount, setAmount] = useState("")
  const [currency, setCurrency] = useState("USD")
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)

  const searchAgents = useCallback(async () => {
    const minBalance = Number(amount) || 0
    if (minBalance <= 0) return
    setFetching(true)
    try {
      const res = await fetch(
        `/api/agents?minBalance=${minBalance}&currency=${currency}`,
      )
      if (res.ok) {
        const data = await res.json()
        setAgents(data)
      }
    } finally {
      setFetching(false)
    }
  }, [amount, currency])

  const createExchange = async () => {
    if (!selectedAgent || !amount) return
    setLoading(true)
    try {
      const res = await fetch("/api/exchanges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentId: selectedAgent,
          amount: Number(amount),
          currency,
        }),
      })
      if (res.ok) {
        toast.success("Exchange created!")
        onCreated()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to create exchange")
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="px-5 py-6 sm:px-6">
      <button
        onClick={onBack}
        className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
        Back
      </button>

      <h2 className="text-lg font-bold tracking-tight">New Exchange</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter the amount you want to exchange.
      </p>

      <div className="mt-6 space-y-4">
        <div>
          <label
            htmlFor="amount"
            className="mb-1.5 block text-sm font-medium"
          >
            Cash amount
          </label>
          <div className="flex gap-3">
            <div className="relative flex-1">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                $
              </span>
              <input
                id="amount"
                type="number"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="10"
                className="h-12 w-full rounded-xl border bg-card pl-8 pr-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-12 rounded-xl border bg-card px-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="AUD">AUD</option>
            </select>
          </div>
        </div>

        <Button
          onPress={searchAgents}
          isDisabled={!amount || Number(amount) <= 0}
          className="h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground"
        >
          {fetching ? "Searching..." : "Find Agents"}
        </Button>

        {agents.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">
              Available agents ({agents.length})
            </p>
            {agents.map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={`w-full rounded-xl border p-4 text-left transition-all ${
                  selectedAgent === a.id
                    ? "border-primary bg-primary/5 ring-1 ring-primary"
                    : "bg-card hover:border-primary/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-sm">{a.fullName}</div>
                    <div className="mt-0.5 text-xs text-muted-foreground">
                      {a.address}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold">
                      ${a.escrowBalance}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      escrow
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {agents.length === 0 && !fetching && Number(amount) > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No agents available for this amount.
          </p>
        )}

        {selectedAgent && (
          <Button
            onPress={createExchange}
            isDisabled={loading}
            className="h-12 w-full rounded-full bg-foreground text-sm font-bold text-background hover:scale-[1.02]"
          >
            {loading ? "Creating..." : "Create Exchange"}
          </Button>
        )}
      </div>
    </div>
  )
}

function ExchangeCard({
  exch,
  onScan,
  onCancel,
}: {
  exch: Exchange
  onScan?: () => void
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
        {exch.status === "cash_received" && onScan && (
          <Button
            onPress={onScan}
            className="h-9 flex-1 rounded-full bg-primary text-xs font-bold text-primary-foreground"
          >
            <HugeiconsIcon icon={QrCodeScanIcon} size={14} />
            Scan QR
          </Button>
        )}
        {["requested", "accepted"].includes(exch.status) && onCancel && (
          <Button
            onPress={onCancel}
            variant="outline"
            className="h-9 flex-1 rounded-full text-xs"
          >
            Cancel
          </Button>
        )}
      </div>
    </div>
  )
}

function ScanQRView({
  exchangeId,
  onBack,
  onDone,
}: {
  exchangeId: string
  onBack: () => void
  onDone: () => void
}) {
  const [scanning, setScanning] = useState(false)

  const completeScan = async () => {
    setScanning(true)
    try {
      const res = await fetch(`/api/exchanges/${exchangeId}/scan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })
      if (res.ok) {
        toast.success("USDC released to your wallet!")
        onDone()
      } else {
        const err = await res.json()
        toast.error(err.error || "Scan failed")
      }
    } finally {
      setScanning(false)
    }
  }

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

      <h2 className="text-lg font-bold tracking-tight">Scan Agent QR</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Scan the QR code shown on the agent&apos;s phone to confirm and release
        USDC.
      </p>

      <div className="mt-8 w-full max-w-xs rounded-xl border-2 border-dashed border-muted-foreground/30 p-8 text-center">
        <p className="text-xs text-muted-foreground">
          [Camera placeholder — scan QR from agent&apos;s phone]
        </p>
      </div>

      <Button
        onPress={completeScan}
        isDisabled={scanning}
        className="mt-6 h-14 w-full max-w-xs rounded-full bg-primary text-base font-bold text-primary-foreground"
      >
        {scanning ? "Processing..." : "Simulate Scan"}
      </Button>
    </div>
  )
}

export default function TouristDashboard() {
  const [exchanges, setExchanges] = useState<Exchange[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<View>("active")
  const [scanExchangeId, setScanExchangeId] = useState<string | null>(null)

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

  useEffect(() => {
    fetchExchanges()
  }, [fetchExchanges])

  const activeExchanges = exchanges.filter(
    (e) => !["completed", "cancelled", "expired"].includes(e.status),
  )
  const historyExchanges = exchanges.filter((e) =>
    ["completed", "cancelled", "expired"].includes(e.status),
  )

  const cancelExchange = async (id: string) => {
    const res = await fetch(`/api/exchanges/${id}/cancel`, { method: "POST" })
    if (res.ok) {
      toast.success("Exchange cancelled")
      fetchExchanges()
    } else {
      const err = await res.json()
      toast.error(err.error || "Failed to cancel")
    }
  }

  if (view === "new") {
    return (
      <main className="mx-auto w-full max-w-lg">
        <NewExchangeForm
          onBack={() => setView("active")}
          onCreated={() => {
            setView("active")
            fetchExchanges()
          }}
        />
      </main>
    )
  }

  if (view === "scan" && scanExchangeId) {
    return (
      <main className="mx-auto w-full max-w-lg">
        <ScanQRView
          exchangeId={scanExchangeId}
          onBack={() => {
            setScanExchangeId(null)
            setView("active")
          }}
          onDone={() => {
            setScanExchangeId(null)
            setView("active")
            fetchExchanges()
          }}
        />
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg pb-8">
      <div className="flex items-center justify-between px-5 py-5 sm:px-6">
        <div>
          <h1 className="text-lg font-bold tracking-tight">Exchanges</h1>
          <p className="text-xs text-muted-foreground">
            {activeExchanges.length} active
          </p>
        </div>
        <Button
          onPress={() => setView("new")}
          className="h-10 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground"
        >
          <HugeiconsIcon icon={Add01Icon} size={14} />
          New
        </Button>
      </div>

      {loading ? (
        <div className="px-5 space-y-3 sm:px-6">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-24 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : (
        <>
          {activeExchanges.length > 0 && (
            <div className="space-y-3 px-5 sm:px-6">
              {activeExchanges.map((exch) => (
                <ExchangeCard
                  key={exch.id}
                  exch={exch}
                  onScan={() => {
                    setScanExchangeId(exch.id)
                    setView("scan")
                  }}
                  onCancel={() => cancelExchange(exch.id)}
                />
              ))}
            </div>
          )}

          {activeExchanges.length === 0 && (
            <div className="flex flex-col items-center px-5 py-16 text-center sm:px-6">
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted">
                <HugeiconsIcon
                  icon={WalletAdd01Icon}
                  size={20}
                  className="text-muted-foreground"
                />
              </div>
              <p className="text-sm font-medium">No active exchanges</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Create a new exchange to get started.
              </p>
              <Button
                onPress={() => setView("new")}
                variant="outline"
                className="mt-4 h-10 rounded-full text-xs"
              >
                New Exchange
              </Button>
            </div>
          )}

          {historyExchanges.length > 0 && (
            <div className="mt-8">
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
                          ${exch.amount} {exch.currency} → USDC
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(exch.createdAt).toLocaleDateString(
                            "en-ID",
                            {
                              month: "short",
                              day: "numeric",
                            },
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
        </>
      )}
    </main>
  )
}
