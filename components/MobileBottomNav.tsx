"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, UserCheck, Phone, PhoneCall, Bot } from "lucide-react"

const tabs = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Leads", href: "/leads", icon: UserCheck },
  { name: "Campaigns", href: "/campaigns", icon: Phone },
  { name: "Outbound", href: "/outbound", icon: PhoneCall },
  { name: "Fox Intel", href: "/fox", icon: Bot },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'var(--cyber-bg-dark)',
        borderTop: '1px solid var(--cyber-border)',
        paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-around px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = pathname === tab.href || pathname?.startsWith(tab.href + "/")
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex flex-col items-center gap-0.5 px-2 py-1 min-w-[56px]"
              style={{
                color: isActive ? 'var(--cyber-cyan)' : 'var(--cyber-text-muted)',
                textShadow: isActive ? '0 0 8px rgba(0, 240, 255, 0.5)' : 'none',
              }}
            >
              <tab.icon className="w-5 h-5" />
              <span
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontSize: '0.6rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tab.name}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
