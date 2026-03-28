import "@/lib/polyfills"
import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  ClerkProvider,
  SignInButton,
  SignUpButton,
  SignedOut,
} from "@clerk/nextjs"
import { Inter } from "next/font/google"
import "./globals.css"
import "./aeon-globals.css"
import AppShell from "@/components/shell/AppShell"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Aeon Dialer",
  description: "A powerful call center dialer",
  generator: "Aeon CRM",
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    other: [{ rel: "mask-icon", url: "/favicon.svg", color: "#FF4500" }],
  },
  appleWebApp: {
    capable: true,
    title: "AEONDial",
    statusBarStyle: "default",
  },
}

export const viewport: Viewport = {
  themeColor: "#18181B",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="shortcut icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/favicon.svg" />
        <link rel="mask-icon" href="/favicon.svg" color="#FF4500" />
        <meta name="msapplication-TileImage" content="/favicon.svg" />
        <meta name="theme-color" content="#18181B" />
      </head>
      <body className={`${inter.className} bg-neutral-950 text-white antialiased`}>
        <ClerkProvider
          signInFallbackRedirectUrl="/dialer"
          signUpFallbackRedirectUrl="/dialer"
        >
          <header className="fixed right-2 top-2 sm:right-4 sm:top-4 z-50">
            <SignedOut>
              <div className="flex items-center gap-2">
                <SignInButton>
                  <button className="rounded-md border border-neutral-700 bg-neutral-900 px-3 py-1.5 text-sm text-white">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-md bg-orange-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-600">
                    Sign up
                  </button>
                </SignUpButton>
              </div>
            </SignedOut>
          </header>
          <AppShell>{children}</AppShell>
        </ClerkProvider>
      </body>
    </html>
  )
}
