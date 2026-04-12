"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, ChevronDown } from "lucide-react"
import {
  BarChart3,
  Users,
  Phone,
  PhoneCall,
  UserCheck,
  Target,
  Calendar,
  Shield,
  Zap,
  Settings,
  Bot,
} from "lucide-react"

const sections = [
  {
    label: "Core",
    items: [
      { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
      {
        name: "Users",
        href: "/users",
        icon: Users,
        submenu: [
          { name: "All Users", href: "/users" },
          { name: "User Stats", href: "/users/statistics" },
          { name: "Timesheets", href: "/users/timesheets" },
        ],
      },
      {
        name: "Agents",
        href: "/agents",
        icon: Users,
        submenu: [
          { name: "All Agents", href: "/agents" },
          { name: "Live Dialer", href: "/dialer" },
          { name: "Agent Workspace", href: "/agents/workspace" },
          { name: "Agent Status", href: "/agents/status" },
          { name: "Performance", href: "/agents/performance" },
          { name: "Timeclock", href: "/agents/timeclock" },
        ],
      },
    ],
  },
  {
    label: "Campaigns & Leads",
    items: [
      {
        name: "Campaigns",
        href: "/campaigns",
        icon: Phone,
        submenu: [
          { name: "All Campaigns", href: "/campaigns" },
          { name: "Create Campaign", href: "/campaigns/create" },
          { name: "Statistics", href: "/campaigns/stats" },
        ],
      },
      {
        name: "Leads",
        href: "/leads",
        icon: UserCheck,
        submenu: [
          { name: "All Leads", href: "/leads" },
          { name: "Search Leads", href: "/leads/search" },
        ],
      },
      {
        name: "Opportunities",
        href: "/opportunities",
        icon: Target,
        submenu: [{ name: "Pipeline Board", href: "/opportunities" }],
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        name: "Calendars",
        href: "/calendars",
        icon: Calendar,
        submenu: [
          { name: "Calendar View", href: "/calendars" },
          { name: "Appointment List", href: "/calendars/appointments" },
          { name: "Calendar Settings", href: "/calendars/settings" },
        ],
      },
      {
        name: "Reports",
        href: "/reports",
        icon: BarChart3,
        submenu: [
          { name: "Real-Time", href: "/reports/realtime" },
          { name: "Agents", href: "/reports/agents" },
          { name: "Campaigns", href: "/reports/campaigns" },
          { name: "Calls", href: "/reports/calls" },
        ],
      },
      { name: "Outbound", href: "/outbound", icon: Phone },
      { name: "Dialer", href: "/dialer", icon: PhoneCall },
      { name: "Compliance", href: "/compliance", icon: Shield },
    ],
  },
  {
    label: "System",
    items: [
      {
        name: "Automation",
        href: "/automation",
        icon: Zap,
        submenu: [
          { name: "Workflows", href: "/automation" },
          { name: "Triggers", href: "/automation/triggers" },
        ],
      },
      { name: "Admin", href: "/admin", icon: Settings },
      { name: "Integrations", href: "/integrations", icon: Zap },
      { name: "Fox Intelligence", href: "/fox", icon: Bot },
      {
        name: "Settings",
        href: "/settings",
        icon: Settings,
        submenu: [
          { name: "Business Profile", href: "/settings/business" },
          { name: "Team Management", href: "/settings/team" },
          { name: "Telephony", href: "/settings/telephony" },
          { name: "API & Integrations", href: "/settings/integrations" },
          { name: "Notifications", href: "/settings/notifications" },
          { name: "Billing", href: "/settings/billing" },
          { name: "Account", href: "/settings/account" },
          { name: "Security", href: "/settings/security" },
        ],
      },
    ],
  },
]

interface DrawerNavProps {
  isOpen: boolean
  onClose: () => void
}

export default function DrawerNav({ isOpen, onClose }: DrawerNavProps) {
  const pathname = usePathname()
  const [expandedSections, setExpandedSections] = useState<string[]>([])

  const toggleSection = (name: string) => {
    setExpandedSections((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name],
    )
  }

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: 'rgba(0, 0, 0, 0.7)' }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <div
        className="fixed top-0 left-0 h-full z-50 md:hidden overflow-y-auto"
        style={{
          width: '85vw',
          maxWidth: '320px',
          background: 'var(--cyber-bg-dark)',
          borderRight: '1px solid var(--cyber-border)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--cyber-border)' }}
        >
          <span
            style={{
              fontFamily: '"Orbitron", sans-serif',
              color: 'var(--cyber-cyan)',
              fontSize: '1.1rem',
              fontWeight: 700,
              letterSpacing: '0.1em',
              animation: 'neonFlicker 3s infinite',
            }}
          >
            AEON DIAL
          </span>
          <button
            onClick={onClose}
            className="cyber-btn"
            style={{
              padding: '6px',
              minHeight: 'auto',
              border: '1px solid var(--cyber-border)',
            }}
            aria-label="Close drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sections */}
        <div className="py-2">
          {sections.map((section) => (
            <div key={section.label} className="mb-2">
              <div className="cyber-section-label">{section.label}</div>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname?.startsWith(item.href + "/")
                const hasSubmenu = "submenu" in item && item.submenu
                const isExpanded = expandedSections.includes(item.name)

                return (
                  <div key={item.name}>
                    <div className="flex items-center">
                      <Link
                        href={item.href}
                        className="cyber-sidebar-item flex-1"
                        style={{
                          ...(isActive
                            ? {
                                color: 'var(--cyber-cyan)',
                                background: 'var(--cyber-surface)',
                                borderLeftColor: 'var(--cyber-cyan)',
                              }
                            : {}),
                        }}
                        onClick={() => {
                          if (!hasSubmenu) onClose()
                        }}
                      >
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                      {hasSubmenu && (
                        <button
                          onClick={() => toggleSection(item.name)}
                          className="px-3 py-2"
                          style={{ color: 'var(--cyber-text-secondary)' }}
                        >
                          <ChevronDown
                            className={`w-3.5 h-3.5 transition-transform ${
                              isExpanded ? "rotate-180" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>
                    {hasSubmenu && isExpanded && (
                      <div className="ml-4">
                        {item.submenu!.map((sub) => (
                          <Link
                            key={sub.href}
                            href={sub.href}
                            className="cyber-sidebar-item"
                            style={{
                              fontSize: '0.7rem',
                              padding: '0.5rem 1rem',
                              minHeight: '36px',
                              ...(pathname === sub.href
                                ? {
                                    color: 'var(--cyber-cyan)',
                                    background: 'var(--cyber-surface)',
                                    borderLeftColor: 'var(--cyber-cyan)',
                                  }
                                : {}),
                            }}
                            onClick={onClose}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
