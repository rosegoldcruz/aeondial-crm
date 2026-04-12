import "@/lib/polyfills"
import type React from "react"
import type { Metadata, Viewport } from "next"
import {
  ClerkProvider,
} from "@clerk/nextjs"
import { Inter } from "next/font/google"
import "./globals.css"
import "./aeon-globals.css"
import ClientLayout from "./client-layout"
import AeonCursor from "@/components/shell/AeonCursor"

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
        <meta name="theme-color" content="#0a0a0f" />
        <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700&family=JetBrains+Mono:wght@400;600&family=Rajdhani:wght@400;600&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.className} antialiased`} style={{ background: 'var(--cyber-bg-darkest)', color: 'var(--cyber-text-primary)' }}>
        <ClerkProvider
          signInFallbackRedirectUrl="/dialer"
          signUpFallbackRedirectUrl="/dialer"
        >
          <AeonCursor />
          <ClientLayout>{children}</ClientLayout>
        </ClerkProvider>
      </body>
    </html>
  )
}
