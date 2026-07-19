import { LinkButton } from "@workspace/ui/components/button"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  WalletAdd01Icon,
  Store04Icon,
} from "@hugeicons/core-free-icons"
import Image from "next/image"

function SkipLink() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-background focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:shadow-sm focus:ring-2 focus:ring-primary focus:outline-none"
    >
      Skip to content
    </a>
  )
}

export default function LandingPage() {
  return (
    <>
      <SkipLink />
      <div className="flex min-h-svh flex-col bg-background px-5 py-12 sm:items-center sm:justify-center sm:py-0">
        <main
          id="main-content"
          className="mx-auto w-full max-w-md"
          tabIndex={-1}
        >
          <div className="mb-10 flex items-center gap-3">
            <Image
              src="/apple-icon.png"
              alt="0verice"
              width={36}
              height={36}
              className="size-9 rounded-xl"
            />
            <span className="text-xl font-extrabold tracking-tight text-primary">
              0verice
            </span>
          </div>

          <h1 className="text-[2rem] font-black leading-[1.15] tracking-tight sm:text-[2.5rem]">
            Turn leftover cash into USDC
          </h1>

          <p className="mt-4 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Peer-to-peer foreign cash exchange. Escrow-protected on Monad.
            Any amount, instant settlement.
          </p>

          <div className="mt-10 grid gap-4">
            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <HugeiconsIcon
                    icon={WalletAdd01Icon}
                    size={20}
                    className="text-primary"
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight">
                    I have leftover foreign cash
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Find a verified local agent. Hand over your cash. Get USDC
                    in your wallet instantly.
                  </p>
                </div>
              </div>
              <LinkButton
                href="/login?role=tourist"
                className="mt-4 h-12 w-full rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm hover:scale-[1.02] hover:bg-primary/85"
              >
                Exchange cash for USDC
              </LinkButton>
            </div>

            <div className="rounded-xl border bg-card p-5">
              <div className="flex items-start gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-secondary">
                  <HugeiconsIcon
                    icon={Store04Icon}
                    size={20}
                    className="text-secondary-foreground"
                  />
                </span>
                <div className="min-w-0">
                  <h2 className="font-semibold tracking-tight">
                    I want to earn as a local agent
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    Hold USDC? Meet verified tourists and earn 5% margin per
                    exchange, capped at 1 USDC.
                  </p>
                </div>
              </div>
              <LinkButton
                href="/login?role=agent"
                variant="secondary"
                className="mt-4 h-12 w-full rounded-full text-sm font-bold shadow-sm hover:scale-[1.02]"
              >
                Become an agent
              </LinkButton>
            </div>
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground sm:text-sm">
            Escrow-protected on Monad
          </p>
        </main>
      </div>
    </>
  )
}
