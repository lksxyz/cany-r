"use client"

import { authClient } from "@/lib/auth-client"
import { Button } from "@workspace/ui/components/button"
import { useRouter } from "next/navigation"

export function SignOutButton() {
  const router = useRouter()

  return (
    <Button
      variant="outline"
      onClick={async () => {
        await authClient.signOut()
        router.push("/login")
      }}
    >
      Sign Out
    </Button>
  )
}
