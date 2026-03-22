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
import { Button } from "@/components/ui/button"
import { motion, AnimatePresence } from "framer-motion"
import { gsap } from "gsap"
import { FloatingDialer } from "@/components/floating-dialer"
import { ScrollProvider } from "@/hooks/use-smooth-scroll"
import { useHapticFeedback } from "@/hooks/use-haptic-feedback"
import { useDeviceCapabilities } from "@/hooks/use-device-capabilities"
import { usePerformanceGovernor } from "@/hooks/use-performance-governor"
import { getAnimationConfig } from "@/lib/animation-config"
import { ThumbNavigation } from "@/components/thumb-navigation"

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
              ? "flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-100"
              : "hidden xl:flex items-center gap-2 rounded-lg border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-100"
          }
        >
          <Building2 className="h-3.5 w-3.5 text-amber-300" />
          <span>No active organization selected</span>
        </div>
      ) : null}

      <div className="rounded-lg border border-neutral-800 bg-neutral-950/80 px-1.5 py-1 shadow-[0_0_24px_rgba(0,0,0,0.25)] backdrop-blur">
        <OrganizationSwitcher
          afterSelectOrganizationUrl={returnPath}
          afterCreateOrganizationUrl="/dialer"
          afterLeaveOrganizationUrl="/dialer"
          hidePersonal
        />
      </div>

      <div className="rounded-full border border-neutral-800 bg-neutral-950/80 p-1 shadow-[0_0_24px_rgba(0,0,0,0.25)] backdrop-blur">
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
  const [collapsed, setCollapsed] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const auroraRef = useRef<HTMLDivElement>(null)
  const navItemsRef = useRef<{ [key: string]: HTMLDivElement | null }>({})

  const capabilities = useDeviceCapabilities()
  const [governor, governorActions] = usePerformanceGovernor(capabilities)
  const animConfig = getAnimationConfig(governor)
  const { vibrate } = useHapticFeedback()

  const isAuthPage = pathname?.startsWith("/login") || pathname?.startsWith("/register")
  const isHomePage = pathname === "/"

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

  useEffect(() => {
    if (typeof window === "undefined") return

    const mediaQuery = window.matchMedia("(max-width: 1023px)")
    const updateViewport = () => setIsMobileViewport(mediaQuery.matches)

    updateViewport()
    mediaQuery.addEventListener("change", updateViewport)

    return () => mediaQuery.removeEventListener("change", updateViewport)
  }, [])

  const toggleSubmenu = (name: string) => {
    vibrate("light")
    setExpandedMenus((prev) => (prev.includes(name) ? prev.filter((m) => m !== name) : [...prev, name]))
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
            gsap.to(auroraRef.current, { opacity: 0.3, scale: 1, duration: 0.4 * governor.animationScale })
          },
        },
      )
    }
  }

  if (isAuthPage || isHomePage) {
    return (
      <ScrollProvider>
        {children}
      </ScrollProvider>
    )
  }

  if (capabilities.isMobile || isMobileViewport) {
    return (
      <ScrollProvider>
        <div className="flex flex-col min-h-screen">
          <header className="sticky top-0 z-30 flex min-h-14 items-center justify-between gap-3 border-b border-neutral-800 bg-neutral-900 px-4 py-2 flex-shrink-0">
            <h1 className="text-lg font-bold text-orange-500">AEON DIAL</h1>
            <SignedIn>
              <ClerkShellControls compact />
            </SignedIn>
          </header>

          <main className="flex-1 overflow-y-auto bg-neutral-950 pb-24">{children}</main>

          <ThumbNavigation navigation={navigation.filter((item) => !item.submenu)} />

          <FloatingDialer />
        </div>
      </ScrollProvider>
    )
  }

  return (
    <div className="flex h-screen">
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 256 }}
        transition={{
          duration: animConfig.transitionDuration,
          ease: "easeInOut",
        }}
        className="relative bg-neutral-900 border-r border-neutral-800 overflow-hidden flex flex-col"
      >
        {animConfig.enableGlow && (
          <div
            ref={auroraRef}
            className="absolute inset-0 pointer-events-none opacity-30"
            style={{
              background: "radial-gradient(circle at 50% 50%, rgba(249, 115, 22, 0.3) 0%, transparent 70%)",
              mixBlendMode: "screen",
              filter: animConfig.enableBlur ? "blur(40px)" : "blur(20px)",
            }}
          />
        )}

        <div className="relative z-10 flex flex-col h-full">
          <div className="flex items-center justify-between h-14 px-4 border-b border-neutral-800 flex-shrink-0">
            <AnimatePresence mode="wait">
              {collapsed ? (
                <motion.div
                  key="collapsed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: animConfig.transitionDuration }}
                  className="flex flex-col items-center justify-center w-full"
                >
                  <span className="text-sm font-bold text-orange-500 tracking-wider">AD</span>
                  <span className="text-[8px] text-neutral-500">v1.0</span>
                </motion.div>
              ) : (
                <motion.div
                  key="expanded"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: animConfig.transitionDuration }}
                >
                  <h1 className="text-lg font-bold text-orange-500">AEON DIAL</h1>
                  <p className="text-[10px] text-neutral-500">v1.0.0</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                vibrate("light")
                setCollapsed(!collapsed)
              }}
              className="text-neutral-400 hover:text-orange-500 hover:bg-neutral-800 h-8 w-8 flex-shrink-0"
            >
              <Menu className="w-4 h-4" />
            </Button>
          </div>

          <nav className="px-3 py-2 space-y-0.5 flex-1 overflow-hidden">
            {navigation.map((item) => (
              <div
                key={item.name}
                ref={(el) => {
                  navItemsRef.current[item.name] = el
                }}
                onMouseEnter={() => setHoveredItem(item.name)}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <Link
                  href={item.href}
                  className={`
                    relative flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                    ${
                      pathname === item.href || pathname?.startsWith(item.href + "/")
                        ? "bg-orange-500/20 text-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
                        : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                    }
                  `}
                  style={{
                    mixBlendMode: pathname === item.href || pathname?.startsWith(item.href + "/") ? "screen" : "normal",
                  }}
                  onClick={() => {
                    handleNavClick(item.name)
                    if (item.submenu) {
                      toggleSubmenu(item.name)
                    }
                  }}
                >
                  {(pathname === item.href || pathname?.startsWith(item.href + "/")) && animConfig.enableGlow && (
                    <motion.div
                      layoutId="activeGlow"
                      className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        duration: animConfig.transitionDuration,
                      }}
                    />
                  )}

                  <div className="relative flex items-center gap-2">
                    <item.icon className="w-3.5 h-3.5 flex-shrink-0" />
                    <AnimatePresence mode="wait">
                      {!collapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: "auto" }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: animConfig.transitionDuration }}
                        >
                          {item.name}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                  {item.submenu && !collapsed && (
                    <ChevronDown
                      className={`w-3 h-3 transition-transform ${expandedMenus.includes(item.name) ? "rotate-180" : ""}`}
                    />
                  )}
                </Link>

                {item.submenu && expandedMenus.includes(item.name) && !collapsed && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: animConfig.transitionDuration }}
                    className="ml-5 mt-0.5 space-y-0.5 overflow-hidden"
                  >
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.href}
                        href={subitem.href}
                        className={`
                          block px-2 py-1 rounded-lg text-[11px] transition-colors
                          ${
                            pathname === subitem.href
                              ? "text-orange-500 bg-neutral-800"
                              : "text-neutral-500 hover:text-white hover:bg-neutral-800"
                          }
                        `}
                        onClick={() => handleNavClick(subitem.name)}
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </motion.div>
                )}
              </div>
            ))}
          </nav>

          <div className="px-3 py-3 border-t border-neutral-800">
            <SignedIn>
              <Link
                href="/settings/account"
                className={`
                  flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all
                  ${pathname?.startsWith("/settings/account") ? "bg-orange-500/20 text-orange-500" : "text-neutral-400 hover:text-white hover:bg-neutral-800"}
                `}
              >
                <Settings className="w-3.5 h-3.5 flex-shrink-0" />
                {!collapsed && <span>Account Manager</span>}
              </Link>
            </SignedIn>

            <SignedOut>
              <SignInButton>
                <button className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-all">
                  <LogIn className="w-3.5 h-3.5 flex-shrink-0" />
                  {!collapsed && <span>Sign In</span>}
                </button>
              </SignInButton>
            </SignedOut>
          </div>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        <header className="h-16 bg-neutral-900 border-b border-neutral-800 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm text-neutral-400">
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <SignedIn>
              <ClerkShellControls />
            </SignedIn>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-neutral-400">System Online</span>
            </div>
            <div className="hidden xl:block text-xs text-neutral-500">
              GPU: {governor.webGLQuality.toUpperCase()} | FPS: {governor.currentFPS} | Scale: {(governor.animationScale * 100).toFixed(0)}%{governor.isThrottled ? ' (THROTTLED)' : ''}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto bg-neutral-950">{children}</main>
      </div>

      <FloatingDialer />
    </div>
  )
}
