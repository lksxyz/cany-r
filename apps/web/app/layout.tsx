import type { Metadata } from "next"
import { Geist_Mono } from "next/font/google"
import "@fontsource/open-runde/400.css"
import "@fontsource/open-runde/700.css"

import "@workspace/ui/globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { cn } from "@workspace/ui/lib/utils"
import { Providers as WalletProviders } from "@/components/providers"
import { Toaster } from "@workspace/ui/components/sonner"

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

const title = "0verice — Turn your travel leftovers into USDC, instantly."
const description =
  "Exchange leftover foreign cash for USDC via verified local agents in Bali. Escrow-protected on Monad."

export const metadata: Metadata = {
  metadataBase: new URL("https://0verice.com"),
  title: {
    default: title,
    template: "%s | 0verice",
  },
  description,
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "0verice",
    title,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "0verice",
    statusBarStyle: "default",
  },
  applicationName: "0verice",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans")}
      style={
        { "--font-sans": '"Open Runde", sans-serif' } as React.CSSProperties
      }
    >
      <body>
        <ThemeProvider>
          <WalletProviders>
            {children}
            <Toaster />
          </WalletProviders>
        </ThemeProvider>
      </body>
    </html>
  )
}
