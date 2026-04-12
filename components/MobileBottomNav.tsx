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
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0a0a] border-t border-[#262626]"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex items-stretch h-14">
        {TABS.map((tab) => {
          const active = pathname === tab.href
            || (tab.href !== "/menu" && pathname?.startsWith(tab.href))
          const isDialer = tab.href === "/dialer"

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <tab.icon
                className={`w-5 h-5 ${
                  active || isDialer
                    ? "text-[#FF6B35]"
                    : "text-[#525252]"
                }`}
                strokeWidth={active ? 2.5 : 1.5}
              />
              <span
                className={`text-[9px] font-medium tracking-wider uppercase ${
                  active || isDialer
                    ? "text-[#FF6B35]"
                    : "text-[#525252]"
                }`}
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
