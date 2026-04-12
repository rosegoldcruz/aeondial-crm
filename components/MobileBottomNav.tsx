"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BarChart3, UserCheck, Phone, PhoneCall, LayoutGrid } from "lucide-react"

const TABS = [
  { label: "Dashboard", href: "/dashboard",  icon: BarChart3   },
  { label: "Leads",     href: "/leads",       icon: UserCheck   },
  { label: "Dialer",    href: "/dialer",      icon: PhoneCall   },
  { label: "Campaigns", href: "/campaigns",   icon: Phone       },
  { label: "Menu",      href: "/menu",        icon: LayoutGrid  },
]

export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'var(--cyber-bg-dark)',
        borderTop: '1px solid var(--cyber-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map((tab) => {
          const active = pathname === tab.href
            || (tab.href !== "/menu" && pathname?.startsWith(tab.href))
          const isDialer = tab.href === "/dialer"
          const highlighted = active || isDialer

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors min-h-[44px]"
              style={{
                color: highlighted ? 'var(--cyber-cyan)' : 'var(--cyber-text-muted)',
                textShadow: highlighted ? '0 0 8px rgba(0, 240, 255, 0.4)' : 'none',
              }}
            >
              <tab.icon
                className="w-5 h-5"
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                style={{
                  fontFamily: '"Orbitron", sans-serif',
                  fontSize: '0.55rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
