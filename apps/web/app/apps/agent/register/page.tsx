"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft01Icon } from "@hugeicons/core-free-icons"
import { toast } from "sonner"

export default function AgentRegisterPage() {
  const router = useRouter()
  const [fullName, setFullName] = useState("")
  const [address, setAddress] = useState("")
  const [currency, setCurrency] = useState("IDR")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/agents/register")
        if (res.ok) {
          router.replace("/apps/agent")
        }
      } catch {
        // not registered yet
      } finally {
        setChecking(false)
      }
    }
    check()
  }, [router])

  const handleSubmit = async () => {
    if (!fullName || !address) return
    setLoading(true)
    try {
      const res = await fetch("/api/agents/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, address, currency }),
      })
      if (res.ok) {
        toast.success("Profile created!")
        router.push("/apps/agent")
      } else {
        const err = await res.json()
        toast.error(err.error || "Failed to register")
      }
    } finally {
      setLoading(false)
    }
  }

  if (checking) {
    return (
      <main className="mx-auto flex w-full max-w-lg items-center justify-center py-20">
        <p className="animate-pulse text-sm text-muted-foreground">
          Loading...
        </p>
      </main>
    )
  }

  return (
    <main className="mx-auto w-full max-w-lg pb-8">
      <div className="px-5 py-6 sm:px-6">
        <button
          onClick={() => router.push("/apps")}
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
          Back
        </button>

        <h1 className="text-xl font-black tracking-tight">
          Become an Agent
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Set up your agent profile to start receiving exchange requests.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="fullName"
              className="mb-1.5 block text-sm font-medium"
            >
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Your full name"
              className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="address"
              className="mb-1.5 block text-sm font-medium"
            >
              Location Address
            </label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="e.g. Kuta, Bali"
              className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            />
          </div>

          <div>
            <label
              htmlFor="currency"
              className="mb-1.5 block text-sm font-medium"
            >
              Preferred Currency
            </label>
            <select
              id="currency"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="h-12 w-full rounded-xl border bg-card px-4 text-base outline-none focus:border-primary focus:ring-1 focus:ring-primary"
            >
              <option value="IDR">IDR - Indonesian Rupiah</option>
              <option value="THB" disabled>THB - Thai Baht</option>
              <option value="SGD" disabled>SGD - Singapore Dollar</option>
              <option value="MYR" disabled>MYR - Malaysian Ringgit</option>
              <option value="PHP" disabled>PHP - Philippine Peso</option>
              <option value="VND" disabled>VND - Vietnamese Dong</option>
              <option value="MMK" disabled>MMK - Myanmar Kyat</option>
              <option value="KHR" disabled>KHR - Cambodian Riel</option>
              <option value="LAK" disabled>LAK - Lao Kip</option>
              <option value="BND" disabled>BND - Brunei Dollar</option>
            </select>
          </div>

          <Button
            onPress={handleSubmit}
            isDisabled={loading || !fullName || !address}
            className="h-14 w-full rounded-full bg-foreground text-base font-bold text-background hover:scale-[1.02]"
          >
            {loading ? "Creating..." : "Create Profile"}
          </Button>
        </div>
      </div>
    </main>
  )
}
