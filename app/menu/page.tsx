"use client"
import Link from "next/link"
import {
  BarChart3, Users, Phone, PhoneCall, UserCheck, Target,
  Calendar, Shield, Zap, Settings, Bot, LayoutGrid
} from "lucide-react"

const sections = [
  {
    label: "// CORE",
    items: [
      { name: "Dashboard",    href: "/dashboard",   icon: BarChart3  },
      { name: "Users",        href: "/users",        icon: Users      },
      { name: "Agents",       href: "/agents",       icon: Users      },
    ],
  },
  {
    label: "// CAMPAIGNS & LEADS",
    items: [
      { name: "Campaigns",    href: "/campaigns",    icon: Phone      },
      { name: "Leads",        href: "/leads",        icon: UserCheck  },
      { name: "Opportunities",href: "/opportunities",icon: Target     },
    ],
  },
  {
    label: "// OPERATIONS",
    items: [
      { name: "Calendars",    href: "/calendars",    icon: Calendar   },
      { name: "Reports",      href: "/reports",      icon: BarChart3  },
      { name: "Outbound",     href: "/outbound",     icon: Zap        },
      { name: "Dialer",       href: "/dialer",       icon: PhoneCall  },
      { name: "Compliance",   href: "/compliance",   icon: Shield     },
      { name: "Automation",   href: "/automation",   icon: Zap        },
    ],
  },
  {
    label: "// SYSTEM",
    items: [
      { name: "Admin",        href: "/admin",        icon: Settings   },
      { name: "Integrations", href: "/integrations", icon: LayoutGrid },
      { name: "Fox Intel",    href: "/fox",          icon: Bot        },
      { name: "Settings",     href: "/settings",     icon: Settings   },
    ],
  },
]

export default function MenuPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] px-4 pt-4 pb-24">
      <h1 className="text-xs font-semibold text-[#525252] uppercase tracking-[0.2em] mb-4">
        Navigation
      </h1>

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.label}>
            <p className="text-[10px] font-semibold text-[#FF6B35] uppercase tracking-[0.15em] mb-2 px-1">
              {section.label}
            </p>
            <div className="bg-[#111111] rounded-xl overflow-hidden border border-[#1e1e1e] divide-y divide-[#1e1e1e]">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-4 py-3.5 text-[#a3a3a3] hover:text-white hover:bg-[#1a1a1a] transition-colors active:bg-[#222222]"
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="ml-auto text-[#333333]">›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
