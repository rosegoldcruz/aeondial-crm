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
    <div className="min-h-screen px-4 pt-6 pb-24" style={{ background: 'var(--cyber-bg-dark)' }}>
      <h1
        className="mb-6 px-1"
        style={{
          fontFamily: '"Orbitron", sans-serif',
          fontSize: '0.7rem',
          textTransform: 'uppercase',
          letterSpacing: '0.15em',
          color: 'var(--cyber-text-muted)',
        }}
      >
        <span style={{ color: 'var(--cyber-cyan)' }}>// </span>Navigation
      </h1>

      <div className="space-y-0" style={{ borderTop: '1px solid var(--cyber-border)' }}>
        {sections.map((section) => (
          <div key={section.label} style={{ borderBottom: '1px solid var(--cyber-border)' }}>
            <p
              className="px-4 pt-4 pb-2"
              style={{
                fontFamily: '"Orbitron", sans-serif',
                fontSize: '0.65rem',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                color: 'var(--cyber-text-muted)',
              }}
            >
              <span style={{ color: 'var(--cyber-cyan)' }}>// </span>
              {section.label.replace('// ', '')}
            </p>
            <div>
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="cyber-menu-item flex items-center gap-3 px-4 min-h-[44px] transition-colors"
                  style={{
                    fontFamily: '"Orbitron", sans-serif',
                    fontSize: '0.8rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--cyber-text-secondary)',
                  }}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--cyber-text-muted)' }} />
                  <span>{item.name}</span>
                  <span className="ml-auto" style={{ color: 'var(--cyber-text-muted)', fontSize: '0.9rem' }}>›</span>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
