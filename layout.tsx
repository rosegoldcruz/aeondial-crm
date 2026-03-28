import type { Metadata } from 'next'
import './globals.css'
import './aeon-globals.css'   // ← AEON design system (new file, separate from your existing globals)
import AppShell from '@/components/shell/AppShell'

export const metadata: Metadata = {
  title: 'AEON Dial — CRM & Intelligence',
  description: 'AEON Dial — Advanced Efficient Optimized Network',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {/*
          AppShell wraps all 72 routes automatically.
          - /login and /register render WITHOUT the shell (handled inside AppShell)
          - Every other route gets the full sidebar + topbar + statusbar
          - No changes needed to any page.tsx file
        */}
        <AppShell>
          {children}
        </AppShell>
      </body>
    </html>
  )
}
