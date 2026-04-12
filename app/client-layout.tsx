"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import {
  LogIn,
  Phone,
  PhoneCall,
  Users,
  BarChart3,
  Settings,
  Shield,
  Zap,
  Bot,
  Menu,
  ChevronDown,
  UserCheck,
  Target,
  Calendar,
  Building2,
  X,
  Pin,
  PinOff,
} from "lucide-react"
import {
  OrganizationSwitcher,
  SignInButton,
  SignedIn,
  SignedOut,
  UserButton,
  useAuth,
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
import { ThumbNavigation } from "@/components/thumb-navigation"
import MobileBottomNav from "@/components/MobileBottomNav"
import DrawerNav from "@/components/DrawerNav"

const navigation = [
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
]

function ClerkShellControls({ compact = false }: { compact?: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const { orgId } = useAuth()
  const previousOrgId = useRef<string | null | undefined>(orgId)
  const returnPath = pathname && pathname.startsWith("/") ? pathname : "/dialer"
  const syncUrl = `/org-sync?redirect_url=${encodeURIComponent(returnPath)}`

  useEffect(() => {
    if (previousOrgId.current === orgId) {
      return
    }

    previousOrgId.current = orgId

    if (pathname?.startsWith("/dialer")) {
      router.replace("/dialer")
      router.refresh()
    }
  }, [orgId, pathname, router])

  return (
    <div className="flex flex-wrap items-center justify-end gap-2">
      {!orgId ? (
        <div
          className={
            compact
              ? "flex items-center gap-2 px-2 py-1 text-[11px]"
              : "hidden xl:flex items-center gap-2 px-3 py-2 text-xs"
          }
          style={{
            border: '1px solid rgba(255, 184, 0, 0.25)',
            background: 'rgba(255, 184, 0, 0.08)',
            color: '#ffb800',
          }}
        >
          <Building2 className="h-3.5 w-3.5" style={{ color: '#ffb800' }} />
          <span>No active organization selected</span>
        </div>
      ) : null}

      <div style={{ border: '1px solid var(--aeon-border)', background: 'var(--aeon-bg2)', borderRadius: '4px' }} className="px-1.5 py-1 backdrop-blur">
        <OrganizationSwitcher
          afterSelectOrganizationUrl={syncUrl}
          afterCreateOrganizationUrl={syncUrl}
          afterLeaveOrganizationUrl="/org-sync?redirect_url=%2Fdialer"
          hidePersonal
        />
      </div>

      <div style={{ border: '1px solid var(--aeon-border)', background: 'var(--aeon-bg2)', borderRadius: '50%' }} className="p-1 backdrop-blur">
        <UserButton afterSignOutUrl="/" />
      </div>
    </div>
  )
}

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [headerDate, setHeaderDate] = useState("")
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [sidebarHoverMode, setSidebarHoverMode] = useState(false)
  const [sidebarPinned, setSidebarPinned] = useState(false)
  const auroraRef = useRef<HTMLDivElement>(null)
  const navItemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const capabilities = useDeviceCapabilities()
  const [governor] = usePerformanceGovernor(capabilities)
  const animConfig = getAnimationConfig(governor)
  const { vibrate } = useHapticFeedback()

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")
  const isHomePage = pathname === "/"

  useEffect(() => {
    setMounted(true)
    setHeaderDate(
      new Intl.DateTimeFormat("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }).format(new Date()),
    )
  }, [])

  // Load sidebar preferences from localStorage
  useEffect(() => {
    try {
      setSidebarHoverMode(localStorage.getItem("sidebar_hover_mode") === "true")
      setSidebarPinned(localStorage.getItem("sidebar_pinned") === "true")
    } catch {}
  }, [])

  useEffect(() => {
    if (auroraRef.current && animConfig.enableGlow) {
      const duration = 2 / governor.animationScale
      gsap.to(auroraRef.current, {
        duration,
        filter: "hue-rotate(360deg)",
        repeat: -1,
        ease: "none",
      })
    }
  }, [animConfig.enableGlow, governor.animationScale])

  useEffect(() => {
    if (animConfig.enableMicroAnimations) {
      Object.values(navItemsRef.current).forEach((el) => {
        if (el) {
          gsap.to(el, {
            x: "random(-2, 2)",
            y: "random(-1, 1)",
            duration: "random(2, 4)",
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          })
        }
      })
    }
  }, [animConfig.enableMicroAnimations])

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false)
    setDrawerOpen(false)
  }, [pathname])

  const toggleSubmenu = (name: string) => {
    vibrate("light")
    setExpandedMenus((prev) =>
      prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name],
    )
  }

  const handleNavClick = (itemName: string) => {
    vibrate("light")
    if (auroraRef.current && animConfig.enableGlow) {
      gsap.fromTo(
        auroraRef.current,
        { opacity: 0, scale: 0.8 },
        {
          opacity: 1,
          scale: 1.2,
          duration: 0.6 * governor.animationScale,
          ease: "power2.out",
          onComplete: () => {
            gsap.to(auroraRef.current, {
              opacity: 0.3,
              scale: 1,
              duration: 0.4 * governor.animationScale,
            })
          },
        },
      )
    }
  }

  const toggleSidebarPin = () => {
    const next = !sidebarPinned
    setSidebarPinned(next)
    try { localStorage.setItem("sidebar_pinned", String(next)) } catch {}
  }

  if (isAuthPage || isHomePage) {
    return (
      <ScrollProvider>
        {children}
      </ScrollProvider>
    )
  }

  return (
    <ScrollProvider>
      {/* Mobile backdrop — click to close sidebar */}
      {mobileSidebarOpen && (
        <div
          className="shell-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <div className="shell-layout">
        {/* ── SIDEBAR ──
            Mobile: off-screen by default, slides in via .is-open
            Desktop (≥768px): always visible, fixed at --sidebar-width */}
        <aside className={[
          "shell-sidebar",
          mobileSidebarOpen ? "is-open" : "",
          sidebarHoverMode ? "hover-mode" : "",
          sidebarPinned ? "pinned" : "",
        ].filter(Boolean).join(" ")}>
          {animConfig.enableGlow && (
            <div
              ref={auroraRef}
              className="absolute inset-0 pointer-events-none opacity-30"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, rgba(0, 229, 255, 0.2) 0%, transparent 70%)",
                mixBlendMode: "screen",
                filter: animConfig.enableBlur ? "blur(40px)" : "blur(20px)",
              }}
            />
          )}

          <div className="relative z-10 flex flex-col h-full">
            {/* Logo row */}
            <div className="flex items-center justify-between h-14 px-4 border-b flex-shrink-0" style={{ borderColor: 'var(--cyber-border)', background: 'var(--cyber-bg-dark)' }}>
              <div className="sidebar-logo-text overflow-hidden transition-all duration-200">
                <h1 className="text-lg font-bold" style={{ fontFamily: '"Orbitron", sans-serif', color: 'var(--cyber-cyan)', animation: 'neonFlicker 3s infinite', letterSpacing: '0.1em' }}>AEON DIAL</h1>
                <p className="text-[10px]" style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--cyber-text-muted)' }}>v1.0.0</p>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {/* Pin button — desktop hover-mode only */}
                {sidebarHoverMode && (
                  <button
                    className={`sidebar-pin-btn${sidebarPinned ? " active" : ""}`}
                    onClick={toggleSidebarPin}
                    title={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
                    aria-label={sidebarPinned ? "Unpin sidebar" : "Pin sidebar open"}
                  >
                    {sidebarPinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                  </button>
                )}
                {/* Close button — CSS: visible on mobile, hidden on desktop */}
                <button
                  className="shell-sidebar-close cyber-btn h-8 w-8 items-center justify-center"
                  style={{ padding: '4px', minHeight: 'auto', border: '1px solid var(--cyber-border)' }}
                  onClick={() => setMobileSidebarOpen(false)}
                  aria-label="Close menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nav — overscroll-contain keeps wheel events in the sidebar */}
            <nav className="px-1 py-2 space-y-0.5 flex-1 overflow-y-auto" style={{ overscrollBehavior: 'contain', minHeight: 0 }}>
              {navigation.map((item) => (
                <div
                  key={item.name}
                  ref={(el) => {
                    navItemsRef.current[item.name] = el
                  }}
                >
                  <Link
                    href={item.href}
                    className="cyber-sidebar-item"
                    style={{
                      ...(pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? {
                            color: 'var(--cyber-cyan)',
                            background: 'var(--cyber-surface)',
                            borderLeftColor: 'var(--cyber-cyan)',
                            boxShadow: 'inset 0 0 20px rgba(0, 240, 255, 0.03)',
                          }
                        : {}),
                    }}
                    onClick={() => {
                      handleNavClick(item.name)
                      if (item.submenu) {
                        toggleSubmenu(item.name)
                      }
                    }}
                  >
                    <div className="relative flex items-center gap-2">
                      <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="sidebar-label transition-all duration-200">{item.name}</span>
                    </div>
                    {item.submenu && (
                      <ChevronDown
                        className={`sidebar-chevron w-3 h-3 transition-transform ml-auto ${
                          expandedMenus.includes(item.name) ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>

                  {item.submenu && expandedMenus.includes(item.name) && (
                    <div className="sidebar-submenu ml-5 mt-0.5 space-y-0.5">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.href}
                          href={subitem.href}
                          className="cyber-sidebar-item"
                          style={{
                            fontSize: '0.7rem',
                            padding: '0.5rem 1rem',
                            minHeight: '36px',
                            ...(pathname === subitem.href
                              ? {
                                  color: 'var(--cyber-cyan)',
                                  background: 'var(--cyber-surface)',
                                  borderLeftColor: 'var(--cyber-cyan)',
                                }
                              : {}),
                          }}
                          onClick={() => handleNavClick(subitem.name)}
                        >
                          {subitem.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            {/* Footer */}
            <div className="px-3 py-3" style={{ borderTop: '1px solid var(--cyber-border)' }}>
              <SignedIn>
                <Link
                  href="/settings/account"
                  className="cyber-sidebar-item"
                  style={{
                    fontSize: '0.75rem',
                    ...(pathname?.startsWith("/settings/account")
                      ? {
                          color: 'var(--cyber-cyan)',
                          background: 'var(--cyber-surface)',
                          borderLeftColor: 'var(--cyber-cyan)',
                        }
                      : {}),
                  }}
                >
                  <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Account Manager</span>
                </Link>
              </SignedIn>

              <SignedOut>
                <SignInButton>
                  <button className="cyber-btn w-full flex items-center gap-2 text-xs">
                    <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>Sign In</span>
                  </button>
                </SignInButton>
              </SignedOut>
            </div>
          </div>
        </aside>

        {/* ── BODY (topbar + main) ──
            Mobile: full width
            Desktop (≥768px): offset right by --sidebar-width */}
        <div className={`shell-body${sidebarHoverMode ? " sidebar-hover-mode" : ""}`}>
          <header className="shell-topbar" style={{ background: 'var(--cyber-bg-dark)', borderBottom: '1px solid var(--cyber-border)' }}>
            {/* Hamburger — CSS: visible on mobile, hidden on desktop */}
            <button
              className="shell-menu-btn cyber-btn"
              style={{ padding: '6px', minHeight: 'auto', border: '1px solid var(--cyber-border)' }}
              onClick={() => { setMobileSidebarOpen(true); setDrawerOpen(true) }}
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>

            {/* Brand — CSS: visible on mobile, hidden on desktop */}
            <span className="shell-brand" style={{ fontFamily: '"Orbitron", sans-serif', color: 'var(--cyber-cyan)', textShadow: '0 0 12px rgba(0, 240, 255, 0.35)' }}>AEON DIAL</span>

            {/* Date — CSS: hidden on mobile, visible on desktop */}
            <div className="shell-date text-sm" style={{ fontFamily: '"Orbitron", sans-serif', color: 'var(--cyber-cyan)', textTransform: 'uppercase', letterSpacing: '0.05em' }} suppressHydrationWarning>
              {mounted ? headerDate : ""}
            </div>

            <div className="ml-auto flex items-center gap-4">
              <SignedIn>
                <ClerkShellControls />
              </SignedIn>
              <div className="cyber-badge cyber-badge-green" style={{ fontSize: '0.65rem' }}>
                <span>System Online</span>
              </div>
              <div
                className="hidden xl:block text-xs"
                style={{ fontFamily: '"JetBrains Mono", monospace', color: 'var(--cyber-text-muted)' }}
                suppressHydrationWarning
              >
                GPU: {governor.webGLQuality.toUpperCase()} | FPS: {governor.currentFPS} | Scale:{" "}
                {(governor.animationScale * 100).toFixed(0)}%
                {governor.isThrottled ? " (THROTTLED)" : ""}
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto shell-main" style={{ background: 'var(--cyber-bg-darkest)' }}>{children}</main>
        </div>

        {/* Thumb nav — CSS: visible on mobile, hidden on desktop */}
        <div className="shell-thumb-nav-wrap">
          <ThumbNavigation navigation={navigation.filter((item) => !item.submenu)} />
        </div>

        <FloatingDialer />
        <DrawerNav isOpen={drawerOpen} onClose={() => { setDrawerOpen(false); setMobileSidebarOpen(false) }} />
        <MobileBottomNav />
      </div>
    </ScrollProvider>
  )
}
