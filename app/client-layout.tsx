"use client"
import type React from "react"
import { useState, useEffect, useRef } from "react"
import {
  LogIn, Phone, PhoneCall, Users, BarChart3, Settings, Shield, Zap, Bot,
  ChevronDown, UserCheck, Target, Calendar, Building2, ChevronRight,
  LayoutDashboard, List, Megaphone, Headphones, Plug, SlidersHorizontal,
} from "lucide-react"
import {
  OrganizationSwitcher, SignInButton, SignedIn, SignedOut, UserButton, useAuth,
} from "@clerk/nextjs"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { gsap } from "gsap"
import { FloatingDialer } from "@/components/floating-dialer"
import { ScrollProvider } from "@/hooks/use-smooth-scroll"
import { useHapticFeedback } from "@/hooks/use-haptic-feedback"
import { useDeviceCapabilities } from "@/hooks/use-device-capabilities"
import { usePerformanceGovernor } from "@/hooks/use-performance-governor"
import { getAnimationConfig } from "@/lib/animation-config"
import { MobileBottomNav } from "@/components/MobileBottomNav"

// ─────────────────────────────────────────────────────────────
// NAV — grouped sections (ChatGPT / Claude / Manus style)
// ─────────────────────────────────────────────────────────────
const navGroups = [
  {
    label: null,
    items: [
      { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    ],
  },
  {
    label: "People",
    items: [
      { name: "Users", href: "/users", icon: Users, submenu: [
        { name: "All Users", href: "/users" },
        { name: "User Stats", href: "/users/statistics" },
        { name: "Timesheets", href: "/users/timesheets" },
      ]},
      { name: "Agents", href: "/agents", icon: Headphones, submenu: [
        { name: "All Agents", href: "/agents" },
        { name: "Agent Status", href: "/agents/status" },
        { name: "Agent Workspace", href: "/agents/workspace" },
        { name: "Performance", href: "/agents/performance" },
        { name: "Timeclock", href: "/agents/timeclock" },
      ]},
      { name: "Leads", href: "/leads", icon: UserCheck, submenu: [
        { name: "All Leads", href: "/leads" },
        { name: "Search Leads", href: "/leads/search" },
      ]},
      { name: "Opportunities", href: "/opportunities", icon: Target, submenu: [
        { name: "Pipeline Board", href: "/opportunities" },
      ]},
    ],
  },
  {
    label: "Outreach",
    items: [
      { name: "Campaigns", href: "/campaigns", icon: Megaphone, submenu: [
        { name: "All Campaigns", href: "/campaigns" },
        { name: "Create Campaign", href: "/campaigns/create" },
        { name: "Statistics", href: "/campaigns/stats" },
      ]},
      { name: "Dialer", href: "/dialer", icon: PhoneCall },
      { name: "Outbound", href: "/outbound", icon: Phone },
      { name: "Lists", href: "/lists", icon: List, submenu: [
        { name: "Lead Lists", href: "/lists" },
      ]},
    ],
  },
  {
    label: "Schedule",
    items: [
      { name: "Calendars", href: "/calendars", icon: Calendar, submenu: [
        { name: "Calendar View", href: "/calendars" },
        { name: "Appointments", href: "/calendars/appointments" },
        { name: "Settings", href: "/calendars/settings" },
      ]},
    ],
  },
  {
    label: "Analytics",
    items: [
      { name: "Reports", href: "/reports", icon: BarChart3, submenu: [
        { name: "Real-Time", href: "/reports/realtime" },
        { name: "Agents", href: "/reports/agents" },
        { name: "Campaigns", href: "/reports/campaigns" },
        { name: "Calls", href: "/reports/calls" },
      ]},
    ],
  },
  {
    label: "Automation",
    items: [
      { name: "Automation", href: "/automation", icon: Zap, submenu: [
        { name: "Workflows", href: "/automation" },
        { name: "Triggers", href: "/automation/triggers" },
      ]},
      { name: "Fox Intelligence", href: "/fox", icon: Bot },
    ],
  },
  {
    label: "Compliance",
    items: [
      { name: "Compliance", href: "/compliance", icon: Shield, submenu: [
        { name: "DNC Numbers", href: "/compliance/dnc" },
      ]},
    ],
  },
  {
    label: "System",
    items: [
      { name: "Admin", href: "/admin", icon: SlidersHorizontal },
      { name: "Integrations", href: "/integrations", icon: Plug },
      { name: "Settings", href: "/settings", icon: Settings, submenu: [
        { name: "Business Profile", href: "/settings/business" },
        { name: "Team Management", href: "/settings/team" },
        { name: "Telephony", href: "/settings/telephony" },
        { name: "API & Integrations", href: "/settings/integrations" },
        { name: "Notifications", href: "/settings/notifications" },
        { name: "Billing", href: "/settings/billing" },
        { name: "Account", href: "/settings/account" },
        { name: "Security", href: "/settings/security" },
      ]},
    ],
  },
]

function ClerkShellControls() {
  const pathname = usePathname()
  const router = useRouter()
  const { orgId } = useAuth()
  const previousOrgId = useRef<string | null | undefined>(orgId)
  const returnPath = pathname && pathname.startsWith("/") ? pathname : "/dialer"
  const syncUrl = `/org-sync?redirect_url=${encodeURIComponent(returnPath)}`
  useEffect(() => {
    if (previousOrgId.current === orgId) return
    previousOrgId.current = orgId
    if (pathname?.startsWith("/dialer")) { router.replace("/dialer"); router.refresh() }
  }, [orgId, pathname, router])
  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!orgId && (
        <div className="hidden xl:flex items-center gap-2 px-3 py-2 text-xs"
          style={{ border: "1px solid rgba(255,184,0,0.25)", background: "rgba(255,184,0,0.08)", color: "#ffb800" }}>
          <Building2 className="h-3.5 w-3.5" style={{ color: "#ffb800" }} />
          <span>No active organization selected</span>
        </div>
      )}
      <div style={{ border: "1px solid var(--aeon-border)", background: "var(--aeon-bg2)", borderRadius: "4px" }} className="px-1.5 py-1 backdrop-blur">
        <OrganizationSwitcher afterSelectOrganizationUrl={syncUrl} afterCreateOrganizationUrl={syncUrl} afterLeaveOrganizationUrl="/org-sync?redirect_url=%2Fdialer" hidePersonal />
      </div>
      <div style={{ border: "1px solid var(--aeon-border)", background: "var(--aeon-bg2)", borderRadius: "50%" }} className="p-1 backdrop-blur">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )
}

const COLLAPSED_W = 56
const EXPANDED_W  = 220

export default function ClientLayout({ children: pageContent }: React.PropsWithChildren) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [headerDate, setHeaderDate] = useState("")
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const auroraRef = useRef<HTMLDivElement>(null)
  const capabilities = useDeviceCapabilities()
  const [governor] = usePerformanceGovernor(capabilities)
  const animConfig = getAnimationConfig(governor)
  const { vibrate } = useHapticFeedback()
  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")
  const isHomePage = pathname === "/"

  useEffect(() => {
    setMounted(true)
    setHeaderDate(new Intl.DateTimeFormat("en-US", { weekday: "short", year: "numeric", month: "short", day: "numeric" }).format(new Date()))
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("sidebar_expanded")
      if (saved !== null) setExpanded(saved === "true")
    } catch {}
  }, [])

  useEffect(() => {
    if (auroraRef.current && animConfig.enableGlow) {
      gsap.to(auroraRef.current, { duration: 2 / governor.animationScale, filter: "hue-rotate(360deg)", repeat: -1, ease: "none" })
    }
  }, [animConfig.enableGlow, governor.animationScale])

  const toggleExpanded = () => {
    const next = !expanded
    setExpanded(next)
    try { localStorage.setItem("sidebar_expanded", String(next)) } catch {}
  }

  const toggleSubmenu = (name: string) => {
    vibrate("light")
    setExpandedMenus((prev) => prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name])
  }

  if (isAuthPage || isHomePage) return <ScrollProvider>{pageContent}</ScrollProvider>

  const sidebarW = expanded ? EXPANDED_W : COLLAPSED_W

  const SidebarInner = () => (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div style={{
        display: "flex", alignItems: "center", height: 56, flexShrink: 0,
        borderBottom: "1px solid var(--aeon-border)",
        padding: expanded ? "0 10px 0 14px" : "0",
        justifyContent: expanded ? "space-between" : "center",
      }}>
        {expanded && (
          <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: "0.82rem", fontWeight: 700, letterSpacing: "0.12em", color: "var(--cyber-cyan)", textShadow: "0 0 12px rgba(0,240,255,0.35)", whiteSpace: "nowrap" }}>
            AEON DIAL
          </span>
        )}
        <button onClick={toggleExpanded} title={expanded ? "Collapse sidebar" : "Expand sidebar"}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyber-text-muted)", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: 6, flexShrink: 0, transition: "color 0.15s" }}
          onMouseEnter={e => (e.currentTarget.style.color = "var(--cyber-cyan)")}
          onMouseLeave={e => (e.currentTarget.style.color = "var(--cyber-text-muted)")}>
          <ChevronRight className="w-4 h-4" style={{ transform: expanded ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.22s cubic-bezier(0.16,1,0.3,1)" }} />
        </button>
      </div>

      <nav style={{ flex: 1, overflowY: "auto", overflowX: "hidden", padding: "6px 0", scrollbarWidth: "none" }}>
        {navGroups.map((group, gi) => (
          <div key={gi} style={{ marginBottom: expanded ? 2 : 6 }}>
            {group.label && expanded && (
              <div style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--cyber-text-muted)", padding: "8px 14px 2px", opacity: 0.55, whiteSpace: "nowrap" }}>
                {group.label}
              </div>
            )}
            {group.label && !expanded && gi > 0 && (
              <div style={{ height: 1, background: "var(--aeon-border)", margin: "4px 10px" }} />
            )}
            {group.items.map((item: any) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + "/")
              const isOpen = expandedMenus.includes(item.name)
              const hasSub = item.submenu && item.submenu.length > 0
              const baseStyle: React.CSSProperties = {
                display: "flex", alignItems: "center", gap: 10,
                padding: expanded ? "7px 12px" : "0",
                justifyContent: expanded ? "flex-start" : "center",
                background: isActive ? "rgba(0,240,255,0.07)" : "none",
                border: "none",
                borderLeft: expanded && isActive ? "2px solid var(--cyber-cyan)" : "2px solid transparent",
                borderRadius: expanded ? "0 6px 6px 0" : 7,
                color: isActive ? "var(--cyber-cyan)" : "var(--cyber-text-dim)",
                fontSize: "0.72rem", fontWeight: isActive ? 600 : 400,
                letterSpacing: "0.04em", textTransform: "uppercase",
                transition: "all 0.15s", textDecoration: "none", cursor: "pointer",
                margin: expanded ? "1px 6px 1px 0" : "2px auto",
                width: expanded ? "calc(100% - 6px)" : 36,
                minHeight: expanded ? 34 : 36,
                height: expanded ? "auto" : 36,
                flexShrink: 0, whiteSpace: "nowrap", overflow: "hidden",
              }
              return (
                <div key={item.name}>
                  {hasSub ? (
                    <button onClick={() => expanded && toggleSubmenu(item.name)} title={!expanded ? item.name : undefined}
                      style={baseStyle as any}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "var(--cyber-cyan)" }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--cyber-text-dim)" }}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {expanded && (
                        <>
                          <span style={{ flex: 1, textAlign: "left" }}>{item.name}</span>
                          <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", opacity: 0.55 }} />
                        </>
                      )}
                    </button>
                  ) : (
                    <Link href={item.href} title={!expanded ? item.name : undefined}
                      onClick={() => { vibrate("light"); setMobileOpen(false) }}
                      style={baseStyle as any}
                      onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--cyber-cyan)" }}
                      onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.color = "var(--cyber-text-dim)" }}>
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      {expanded && <span>{item.name}</span>}
                    </Link>
                  )}
                  {hasSub && expanded && isOpen && (
                    <div style={{ paddingLeft: 34, paddingBottom: 2 }}>
                      {item.submenu.map((sub: any) => {
                        const subActive = pathname === sub.href
                        return (
                          <Link key={sub.href} href={sub.href}
                            onClick={() => { vibrate("light"); setMobileOpen(false) }}
                            style={{ display: "block", padding: "5px 10px", borderRadius: 5, fontSize: "0.68rem", letterSpacing: "0.03em", color: subActive ? "var(--cyber-cyan)" : "var(--cyber-text-muted)", background: subActive ? "rgba(0,240,255,0.06)" : "none", fontWeight: subActive ? 600 : 400, textDecoration: "none", whiteSpace: "nowrap", transition: "color 0.15s" }}
                            onMouseEnter={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = "var(--cyber-cyan)" }}
                            onMouseLeave={e => { if (!subActive) (e.currentTarget as HTMLElement).style.color = "var(--cyber-text-muted)" }}>
                            {sub.name}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </nav>

      <div style={{ borderTop: "1px solid var(--aeon-border)", padding: expanded ? "8px 6px" : "8px 0", display: "flex", justifyContent: expanded ? "flex-start" : "center" }}>
        <SignedIn>
          <Link href="/settings/account" title={!expanded ? "Account Manager" : undefined}
            onClick={() => setMobileOpen(false)}
            style={{ display: "flex", alignItems: "center", gap: 10, padding: expanded ? "6px 10px" : "0", justifyContent: expanded ? "flex-start" : "center", borderRadius: 6, color: pathname?.startsWith("/settings/account") ? "var(--cyber-cyan)" : "var(--cyber-text-muted)", fontSize: "0.68rem", letterSpacing: "0.04em", textTransform: "uppercase", textDecoration: "none", width: expanded ? "100%" : 36, height: 36, whiteSpace: "nowrap", overflow: "hidden", transition: "color 0.15s" }}>
            <Settings className="w-3.5 h-3.5 flex-shrink-0" />
            {expanded && <span>Account Manager</span>}
          </Link>
        </SignedIn>
        <SignedOut>
          <SignInButton>
            <button style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: "none", border: "none", cursor: "pointer", color: "var(--cyber-text-muted)", fontSize: "0.68rem", width: expanded ? "100%" : 36, height: 36 }}>
              <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
              {expanded && <span>Sign In</span>}
            </button>
          </SignInButton>
        </SignedOut>
      </div>
    </div>
  )

  return (
    <ScrollProvider>
      <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#0a0a0a" }}>

        <aside className="hidden md:flex flex-col" style={{
          width: sidebarW, minWidth: sidebarW, height: "100vh",
          background: "var(--aeon-bg2)", borderRight: "1px solid var(--aeon-border)",
          flexShrink: 0, overflow: "hidden", position: "relative", zIndex: 20,
          transition: "width 0.22s cubic-bezier(0.16,1,0.3,1), min-width 0.22s cubic-bezier(0.16,1,0.3,1)",
        }}>
          {animConfig.enableGlow && (
            <div ref={auroraRef} className="absolute inset-0 pointer-events-none" style={{ opacity: 0.18, background: "radial-gradient(ellipse at 50% 0%, rgba(0,240,255,0.1) 0%, transparent 70%)", zIndex: 0 }} />
          )}
          <div style={{ position: "relative", zIndex: 1, height: "100%" }}>
            <SidebarInner />
          </div>
        </aside>

        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.65)", backdropFilter: "blur(3px)" }} onClick={() => setMobileOpen(false)} />
        )}
        <aside className="md:hidden fixed top-0 left-0 h-full z-50" style={{
          width: EXPANDED_W, background: "var(--aeon-bg2)", borderRight: "1px solid var(--aeon-border)",
          transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
          transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1)",
        }}>
          <SidebarInner />
        </aside>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
          <header className="md:hidden flex items-center justify-between px-4 flex-shrink-0"
            style={{ height: 48, background: "var(--cyber-bg-dark)", borderBottom: "1px solid var(--cyber-border)" }}>
            <button onClick={() => setMobileOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cyber-text-muted)", display: "flex", alignItems: "center" }}>
              <ChevronRight className="w-5 h-5" />
            </button>
            <span style={{ fontFamily: '"Orbitron", sans-serif', fontSize: "0.8rem", fontWeight: 700, letterSpacing: "0.1em", color: "var(--cyber-cyan)", textShadow: "0 0 12px rgba(0,240,255,0.35)" }}>AEON DIAL</span>
            <div className="flex items-center gap-2 ml-auto">
              <SignedIn>
                <OrganizationSwitcher hidePersonal appearance={{ elements: { rootBox: "h-7", organizationSwitcherTrigger: "h-7 text-xs bg-[#1a1a1a] rounded-md px-2 py-1" } }} />
                <UserButton afterSignOutUrl="/" appearance={{ elements: { avatarBox: "h-7 w-7" } }} />
              </SignedIn>
            </div>
          </header>

          <header className="hidden md:flex items-center justify-between px-4 lg:px-6 flex-shrink-0"
            style={{ height: 52, background: "var(--aeon-bg2)", borderBottom: "1px solid var(--aeon-border)" }}>
            <div style={{ fontFamily: '"Orbitron", sans-serif', fontSize: "0.68rem", color: "var(--cyber-cyan)", textTransform: "uppercase", letterSpacing: "0.05em" }} suppressHydrationWarning>
              {mounted ? headerDate : ""}
            </div>
            <div className="ml-auto flex items-center gap-4">
              <SignedIn><ClerkShellControls /></SignedIn>
              <div className="cyber-badge cyber-badge-green" style={{ fontSize: "0.6rem" }}><span>System Online</span></div>
              <div className="hidden xl:block text-xs" style={{ fontFamily: '"JetBrains Mono", monospace', color: "var(--cyber-text-muted)" }} suppressHydrationWarning>
                GPU: {governor.webGLQuality.toUpperCase()} | FPS: {governor.currentFPS} | Scale: {(governor.animationScale * 100).toFixed(0)}%{governor.isThrottled ? " (THROTTLED)" : ""}
              </div>
            </div>
          </header>

          <main style={{ flex: 1, overflowY: "auto", overflowX: "hidden", background: "var(--cyber-bg-darkest, #050508)", minWidth: 0 }} className="pb-20 md:pb-0">
            {pageContent}
          </main>

          <div className="md:hidden"><MobileBottomNav /></div>
        </div>

        <FloatingDialer />
      </div>
    </ScrollProvider>
  )
}
