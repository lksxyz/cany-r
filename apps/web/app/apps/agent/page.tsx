"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useRouter } from "next/navigation"
import { useAccount, useReadContract, useWriteContract, useSignMessage } from "wagmi"
import { keccak256, stringToHex, encodePacked } from "viem"
import QRCode from "qrcode"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  CheckmarkCircle02Icon,
  Cancel01Icon,
  CashbackIcon,
  QrCodeScanIcon,
  AlertCircleIcon,
  ArrowLeft01Icon,
  WalletAdd01Icon,
} from "@hugeicons/core-free-icons"
import { toast } from "sonner"
import { OvericeEscrowABI } from "@/abi/OvericeEscrow"
import { USDC_ABI } from "@/abi/USDC"

const ESCROW_ADDRESS = "0x2d8308205d60a0a5B608bC60d35580d0f89F34Be"
const USDC_ADDRESS = "0x534b2f3A21130d7a60830c2Df862319e593943A3"


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
  qrSignature?: string
  createdAt: string
}

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

function DepositModal({
  open,
  onClose,
  onDeposited,
}: {
  open: boolean
  onClose: () => void
  onDeposited: () => void
}) {
  const [amount, setAmount] = useState("")
  const [step, setStep] = useState<"idle" | "approving" | "depositing" | "syncing" | "done">("idle")
  const { address } = useAccount()
  const { writeContractAsync } = useWriteContract()

  const handleDeposit = async () => {
    if (!amount || !address) return
    const amountDec = BigInt(Math.floor(Number(amount) * 1_000_000))

    try {
      setStep("approving")
      await writeContractAsync({
        address: USDC_ADDRESS,
        abi: USDC_ABI,
        functionName: "approve",
        args: [ESCROW_ADDRESS, amountDec],
      })
      toast.success("USDC approved")

      setStep("depositing")
      await writeContractAsync({
        address: ESCROW_ADDRESS,
        abi: OvericeEscrowABI,
        functionName: "deposit",
        args: [amountDec],
      })
      toast.success("Deposit confirmed on-chain")

      setStep("syncing")
      const res = await fetch("/api/agents/deposit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(amount), txHash: "" }),
      })
      if (res.ok) {
        toast.success("Escrow balance updated")
        setStep("done")
        onDeposited()
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to sync balance")
        setStep("idle")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Transaction failed"
      toast.error(msg)
      setStep("idle")
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40">
      <div className="w-full max-w-lg rounded-t-2xl sm:rounded-2xl bg-card p-6 pb-8">
        <h2 className="text-lg font-bold tracking-tight">Deposit USDC</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deposit USDC into escrow to receive exchange requests.
        </p>

        <div className="mt-4">
          <label htmlFor="deposit-amount" className="mb-1.5 block text-sm font-medium">
            Amount (USDC)
          </label>
          <input
            id="deposit-amount"
            type="number"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="10"
            disabled={step !== "idle"}
            className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary disabled:opacity-50"
          />
        </div>

        <div className="mt-2 text-xs text-muted-foreground">
          ${amount || "0"} USDC = {BigInt(Math.floor(Number(amount || 0) * 1_000_000)).toString()} minor units
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            onPress={onClose}
            variant="outline"
            className="h-12 flex-1 rounded-full text-sm"
            isDisabled={step !== "idle"}
          >
            Cancel
          </Button>
          <Button
            onPress={handleDeposit}
            isDisabled={!amount || Number(amount) <= 0 || step !== "idle"}
            className="h-12 flex-1 rounded-full bg-primary text-sm font-bold text-primary-foreground"
          >
            {step === "idle" && "Deposit"}
            {step === "approving" && "Approving USDC..."}
            {step === "depositing" && "Depositing..."}
            {step === "syncing" && "Syncing..."}
            {step === "done" && "Done"}
          </Button>
        </div>
      </div>
    </div>
  )
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
  const qrPayload =
    exch.qrPayload ||
    JSON.stringify({
      exchangeId: exch.id,
      nonce: exch.qrNonce,
      expiresAt: exch.qrExpiresAt,
    })
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, qrPayload, {
        width: 224,
        margin: 3,
        color: { dark: "#000000", light: "#ffffff" },
      })
    }
  }, [qrPayload])

  const [acknowledging, setAcknowledging] = useState(false)
  const [acknowledged, setAcknowledged] = useState(false)

  const handleManualAcknowledge = async () => {
    setAcknowledging(true)
    try {
      const res = await fetch(`/api/exchanges/${exch.id}/manual-acknowledge`, {
        method: "POST",
      })
      if (res.ok) {
        setAcknowledged(true)
        toast.success("Exchange completed manually")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to acknowledge")
      }
    } catch {
      toast.error("Failed to acknowledge")
    } finally {
      setAcknowledging(false)
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

      <h2 className="text-lg font-bold tracking-tight">Show QR to Tourist</h2>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        Ask the tourist to scan this QR code to release USDC.
      </p>

      <div className="mt-8 flex size-56 items-center justify-center rounded-2xl border-2 border-dashed border-muted-foreground/30 bg-card p-2">
        <canvas ref={canvasRef} className="rounded-lg" />
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

      {!acknowledged ? (
        <Button
          onPress={handleManualAcknowledge}
          isDisabled={acknowledging}
          variant="ghost"
          className="mt-2 h-10 w-full max-w-xs rounded-full text-xs text-muted-foreground"
        >
          {acknowledging ? "Acknowledging..." : "Manual Acknowledge"}
        </Button>
      ) : (
        <p className="mt-2 text-xs text-green-600 dark:text-green-400">
          Acknowledged. Press Done to continue.
        </p>
      )}
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
  const router = useRouter()
  const { address } = useAccount()
  const { signMessageAsync } = useSignMessage()
  const { data: usdcBalanceRaw } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: { enabled: !!address },
  })
  const { data: usdcDecimals } = useReadContract({
    address: USDC_ADDRESS,
    abi: USDC_ABI,
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
  const [showDeposit, setShowDeposit] = useState(false)
  const [checkingReg, setCheckingReg] = useState(true)

  useEffect(() => {
    const checkReg = async () => {
      try {
        const res = await fetch("/api/agents/register")
        if (!res.ok) {
          router.replace("/apps/agent/register")
          return
        }
      } catch {
        router.replace("/apps/agent/register")
        return
      } finally {
        setCheckingReg(false)
      }
    }
    checkReg()
  }, [router])

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
    if (!checkingReg) load()
  }, [checkingReg, fetchExchanges, fetchBalance])

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
    try {
      // Step 1: get nonce + expiry from server
      const initRes = await fetch(`/api/exchanges/${id}/cash-received`, {
        method: "POST",
      })
      if (!initRes.ok) {
        const err = await initRes.json()
        toast.error(err.error || "Failed to initialize")
        return
      }
      const initData = await initRes.json()
      const { nonce, expiresAt } = initData

      // Step 2: sign with wallet
      const exchangeIdBytes = keccak256(stringToHex(id))
      const nonceHash = keccak256(stringToHex(nonce))
      const expiryUnix = BigInt(Math.floor(new Date(expiresAt).getTime() / 1000))

      const packed = encodePacked(
        ["bytes32", "uint256", "uint256"],
        [exchangeIdBytes, BigInt(nonceHash), expiryUnix],
      )
      const digest = keccak256(packed)

      const signature = await signMessageAsync({ message: { raw: digest } })

      // Step 3: confirm with signature
      const confirmRes = await fetch(`/api/exchanges/${id}/cash-received`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nonce, expiresAt, signature }),
      })
      if (confirmRes.ok) {
        toast.success("QR code generated")
        fetchExchanges()
        fetchBalance()
        const updated = exchanges.find((e) => e.id === id)
        if (updated) {
          setShowQR({
            ...updated,
            qrPayload: JSON.stringify({ exchangeId: id, nonce, expiresAt }),
            qrNonce: nonce,
            qrExpiresAt: expiresAt,
            qrSignature: signature,
          })
        }
      } else {
        const err = await confirmRes.json()
        toast.error(err.error || "Failed to confirm cash")
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Signing failed"
      toast.error(msg)
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

  if (checkingReg) {
    return (
      <main className="mx-auto flex w-full max-w-lg items-center justify-center py-20">
        <p className="animate-pulse text-sm text-muted-foreground">Loading...</p>
      </main>
    )
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
      <DepositModal
        open={showDeposit}
        onClose={() => setShowDeposit(false)}
        onDeposited={() => {
          setShowDeposit(false)
          fetchBalance()
        }}
      />

      <div className="px-5 py-5 sm:px-6">
        <div className="mb-5 grid grid-cols-2 gap-3">
          <div className="rounded-xl border bg-card p-4">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Wallet
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {usdcBalance !== null ? usdcBalance.toFixed(2) : "..."}{" "}
              <span className="text-sm font-normal text-muted-foreground">USDC</span>
            </div>
          </div>
          <button
            onClick={() => setShowDeposit(true)}
            className="rounded-xl border bg-card p-4 text-left transition-all hover:border-primary/30"
          >
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              Escrow
            </div>
            <div className="mt-1 text-xl font-bold tracking-tight">
              {balance !== null ? `${balance}` : "..."}{" "}
              <span className="text-sm font-normal text-muted-foreground">USDC</span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-[10px] text-primary">
              <HugeiconsIcon icon={WalletAdd01Icon} size={10} />
              Deposit
            </div>
          </button>
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
                          {new Date(exch.createdAt).toLocaleDateString("en-ID", {
                            month: "short",
                            day: "numeric",
                          })}
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
