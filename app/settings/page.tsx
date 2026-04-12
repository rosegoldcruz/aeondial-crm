"use client"

import { useState, useEffect } from "react"
import { Users, Phone, Plug, Bell, CreditCard, User, Shield, SettingsIcon, ChevronRight, PanelLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function SettingsPage() {
  const [sidebarHoverMode, setSidebarHoverMode] = useState(false)

  useEffect(() => {
    try { setSidebarHoverMode(localStorage.getItem("sidebar_hover_mode") === "true") } catch {}
  }, [])

  const toggleSidebarHoverMode = () => {
    const next = !sidebarHoverMode
    setSidebarHoverMode(next)
    try {
      localStorage.setItem("sidebar_hover_mode", String(next))
      // If disabling hover mode, also clear the pin so sidebar goes back to always-open
      if (!next) localStorage.setItem("sidebar_pinned", "false")
      // Force a page reload so client-layout re-reads localStorage
      window.location.reload()
    } catch {}
  }

  const settingsSections = [
    {
      title: "Team Management",
      description: "Manage users, roles, and permissions",
      icon: Users,
      href: "/settings/team",
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      stats: "47 members",
    },
    {
      title: "Telephony Settings",
      description: "Configure phone system and trunks",
      icon: Phone,
      href: "/settings/telephony",
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      stats: "System online",
    },
    {
      title: "API & Integrations",
      description: "Connect AEON with your tools and services",
      icon: Plug,
      href: "/settings/integrations",
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      stats: "3 connected",
    },
    {
      title: "Notifications",
      description: "Manage how and when you receive notifications",
      icon: Bell,
      href: "/settings/notifications",
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      stats: "Email & SMS",
    },
    {
      title: "Billing & Subscription",
      description: "Manage your plan and payment methods",
      icon: CreditCard,
      href: "/settings/billing",
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
      stats: "Pro Plan",
    },
    {
      title: "Account Settings",
      description: "Manage your personal account information",
      icon: User,
      href: "/settings/account",
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      stats: "Profile",
    },
    {
      title: "Security Settings",
      description: "Protect your account and data",
      icon: Shield,
      href: "/settings/security",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      stats: "85/100",
    },
  ]

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-3 sm:p-6 space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-orange-500/10 rounded-lg">
            <SettingsIcon className="w-6 h-6 text-orange-500" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-orange-500">Settings</h1>
            <p className="text-gray-300 text-sm mt-1">Manage your account, team, and system configuration</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Card className="bg-[#1a1a1a] border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Team Members</p>
                <p className="text-2xl font-bold text-white mt-1">47</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">System Status</p>
                <p className="text-lg font-semibold text-green-500 mt-1 flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  Online
                </p>
              </div>
              <Phone className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Integrations</p>
                <p className="text-2xl font-bold text-white mt-1">3</p>
              </div>
              <Plug className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1a1a1a] border-neutral-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Security Score</p>
                <p className="text-2xl font-bold text-white mt-1">85/100</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Sections */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {settingsSections.map((section, index) => (
            <Link key={index} href={section.href}>
              <Card className="bg-[#1a1a1a] border-neutral-800 hover:border-orange-500 transition-all duration-200 cursor-pointer group h-full">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg ${section.bgColor}`}>
                      <section.icon className={`w-6 h-6 ${section.color}`} />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-600 group-hover:text-orange-500 transition-colors" />
                  </div>
                  <CardTitle className="text-lg text-white mt-3">{section.title}</CardTitle>
                  <CardDescription className="text-sm text-gray-400 leading-relaxed">
                    {section.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                    <span className="text-xs text-gray-500">{section.stats}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <Card className="bg-[#1a1a1a] border-neutral-800">
        <CardHeader>
          <CardTitle className="text-white text-lg">Quick Actions</CardTitle>
          <CardDescription className="text-gray-400">Common settings tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/settings/team">
              <button className="w-full p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg hover:border-orange-500 transition-colors text-left">
                <p className="text-sm font-medium text-white">Invite Team Member</p>
                <p className="text-xs text-gray-500 mt-1">Add new users</p>
              </button>
            </Link>

            <Link href="/settings/integrations">
              <button className="w-full p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg hover:border-orange-500 transition-colors text-left">
                <p className="text-sm font-medium text-white">Connect Integration</p>
                <p className="text-xs text-gray-500 mt-1">Link external tools</p>
              </button>
            </Link>

            <Link href="/settings/billing">
              <button className="w-full p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg hover:border-orange-500 transition-colors text-left">
                <p className="text-sm font-medium text-white">Upgrade Plan</p>
                <p className="text-xs text-gray-500 mt-1">View pricing options</p>
              </button>
            </Link>

            <Link href="/settings/security">
              <button className="w-full p-3 bg-[#0a0a0a] border border-neutral-800 rounded-lg hover:border-orange-500 transition-colors text-left">
                <p className="text-sm font-medium text-white">Security Audit</p>
                <p className="text-xs text-gray-500 mt-1">Review security</p>
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Sidebar Appearance */}
      <Card className="bg-[#1a1a1a] border-neutral-800">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <PanelLeft className="w-5 h-5 text-cyan-500" />
            </div>
            <div>
              <CardTitle className="text-white text-lg">Sidebar Behavior</CardTitle>
              <CardDescription className="text-gray-400">Control how the navigation sidebar opens and closes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-3 border-b border-neutral-800">
            <div>
              <p className="text-sm font-medium text-white">Hover to Open</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Sidebar collapses to icon rail. Expands when your cursor enters it.
                Use the pin button inside the sidebar to lock it open.
              </p>
            </div>
            <button
              onClick={toggleSidebarHoverMode}
              className="relative flex-shrink-0 w-11 h-6 rounded-full transition-colors duration-200 focus:outline-none"
              style={{
                background: sidebarHoverMode ? 'var(--hud-accent)' : 'rgba(255,255,255,0.1)',
                border: '1px solid',
                borderColor: sidebarHoverMode ? 'var(--hud-accent)' : 'rgba(255,255,255,0.15)',
              }}
              role="switch"
              aria-checked={sidebarHoverMode}
              aria-label="Toggle sidebar hover mode"
            >
              <span
                className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                style={{
                  background: sidebarHoverMode ? '#020408' : 'rgba(255,255,255,0.5)',
                  transform: sidebarHoverMode ? 'translateX(20px)' : 'translateX(0)',
                }}
              />
            </button>
          </div>
          <p className="text-xs text-gray-600 mt-3">
            // Changes take effect immediately. Page will reload to apply the new layout.
          </p>
        </CardContent>
      </Card>

      {/* Help Section */}
      <Card className="bg-gradient-to-r from-orange-500/10 to-orange-600/10 border-orange-500/20">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Need Help?</h3>
              <p className="text-sm text-gray-300 mb-4">Our support team is here to help you configure your system</p>
              <div className="flex gap-3">
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium">
                  Contact Support
                </button>
                <button className="px-4 py-2 bg-[#1a1a1a] text-white rounded-lg hover:bg-[#2a2a2a] transition-colors text-sm font-medium border border-neutral-800">
                  View Documentation
                </button>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                <SettingsIcon className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
