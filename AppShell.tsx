'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { NAV_SECTIONS, NavSection, NavItem, ICONS } from './nav-config'

/* ─── tiny SVG icon helper ─── */
function Icon({ d, size = 14 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 14 14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0 }}
    >
      <path d={d} />
    </svg>
  )
}

/* ─── Collapsible nav section ─── */
function NavSectionGroup({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string
}) {
  const hasActive = section.items.some((i) => pathname.startsWith(i.href) && i.href !== '/')
  const [open, setOpen] = useState(!section.collapsible || hasActive)

  return (
    <div className="nav-section">
      <button
        className="nav-section-label"
        onClick={() => section.collapsible && setOpen((o) => !o)}
        style={{ cursor: section.collapsible ? undefined : 'default' }}
      >
        <span>{section.label}</span>
        {section.collapsible && (
          <svg
            width="8"
            height="8"
            viewBox="0 0 8 8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{
              transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s',
              opacity: 0.4,
            }}
          >
            <path d="M1 2l3 3 3-3" />
          </svg>
        )}
      </button>

      {open && (
        <div className="nav-items">
          {section.items.map((item) => {
            const isActive =
              item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname.startsWith(item.href) && item.href !== '/'

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-item${isActive ? ' active' : ''}`}
              >
                <Icon d={item.icon} />
                <span className="nav-item-label">{item.label}</span>
                {item.badge && (
                  <span className={`nav-badge${item.badgeVariant === 'hot' ? ' hot' : ''}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}

/* ─── Main AppShell ─── */
export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [time, setTime] = useState('--:--:--')
  const [sessionId] = useState(() => Math.random().toString(36).slice(2, 10).toUpperCase())
  const [toastVisible, setToastVisible] = useState(false)
  const [toastMsg, setToastMsg] = useState({ title: '', body: '' })
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Canvas ambient background
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const blobsRef = useRef<any[]>([])
  const rafRef = useRef<number>(0)

  // Clock
  useEffect(() => {
    const tick = () => {
      const n = new Date()
      setTime(
        [n.getHours(), n.getMinutes(), n.getSeconds()]
          .map((v) => String(v).padStart(2, '0'))
          .join(':')
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  // Ambient canvas blobs
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let W = 0, H = 0

    const resize = () => {
      W = canvas.width = window.innerWidth
      H = canvas.height = window.innerHeight
      initBlobs()
    }

    const initBlobs = () => {
      blobsRef.current = [
        { x: W * 0.2, y: H * 0.3, r: 220, vx: 0.14, vy: 0.09, magnetic: false },
        { x: W * 0.75, y: H * 0.6, r: 190, vx: -0.11, vy: 0.08, magnetic: false },
        { x: W * 0.5, y: H * 0.8, r: 160, vx: 0.09, vy: -0.10, magnetic: false },
        { x: W * 0.85, y: H * 0.2, r: 140, vx: -0.08, vy: 0.12, magnetic: false },
        { x: mouseRef.current.x || W / 2, y: mouseRef.current.y || H / 2, r: 80, vx: 0, vy: 0, magnetic: true },
      ]
    }

    const draw = () => {
      ctx.clearRect(0, 0, W, H)
      blobsRef.current.forEach((b: any) => {
        if (b.magnetic) {
          b.x += (mouseRef.current.x - b.x) * 0.05
          b.y += (mouseRef.current.y - b.y) * 0.05
        } else {
          b.x += b.vx; b.y += b.vy
          const dx = mouseRef.current.x - b.x
          const dy = mouseRef.current.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)
          if (d < 300) { const f = (300 - d) / 300 * 0.35; b.x -= dx / d * f; b.y -= dy / d * f }
          if (b.x < -b.r) b.x = W + b.r
          if (b.x > W + b.r) b.x = -b.r
          if (b.y < -b.r) b.y = H + b.r
          if (b.y > H + b.r) b.y = -b.r
        }
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r * 1.5)
        g.addColorStop(0, 'rgba(4,14,24,0.45)')
        g.addColorStop(0.6, 'rgba(2,8,16,0.3)')
        g.addColorStop(1, 'rgba(2,4,8,0)')
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r * 1.5, 0, Math.PI * 2)
        ctx.fillStyle = g; ctx.fill()
      })
      // magnetic tinge
      const mb = blobsRef.current[blobsRef.current.length - 1]
      if (mb) {
        const tg = ctx.createRadialGradient(mb.x, mb.y, 0, mb.x, mb.y, mb.r * 3)
        tg.addColorStop(0, 'rgba(0,80,110,0.08)'); tg.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.beginPath(); ctx.arc(mb.x, mb.y, mb.r * 3, 0, Math.PI * 2)
        ctx.fillStyle = tg; ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }

    resize()
    window.addEventListener('resize', resize)
    draw()

    const onMouseMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY } }
    window.addEventListener('mousemove', onMouseMove)

    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('mousemove', onMouseMove)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // Toast helper
  const showToast = (title: string, body: string) => {
    setToastMsg({ title, body })
    setToastVisible(true)
    setTimeout(() => setToastVisible(false), 4000)
  }

  // Breadcrumb: derive label from pathname
  const crumb = pathname
    .split('/')
    .filter(Boolean)
    .map((s) => s.replace(/-/g, ' ').toUpperCase())
    .join(' / ') || 'HOME'

  // Auth pages — render naked (no shell)
  if (pathname === '/login' || pathname === '/register') {
    return <>{children}</>
  }

  return (
    <>
      {/* Ambient canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      />

      {/* Grid overlay */}
      <div className="aeon-grid-overlay" />
      <div className="aeon-scanline" />

      {/* App shell */}
      <div className={`aeon-app${sidebarOpen ? '' : ' sidebar-collapsed'}`}>

        {/* ── SIDEBAR ── */}
        <aside className="aeon-sidebar">
          <div className="sidebar-logo">
            <div className="sidebar-wordmark">
              <div className="logo-icon">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
                  stroke="#00e5ff" strokeWidth="1.4">
                  <path d="M7 1L13 4V10L7 13L1 10V4L7 1z" />
                  <path d="M7 4L10 6V9L7 11L4 9V6L7 4z" opacity=".5" />
                </svg>
              </div>
              <span>AEON</span>
            </div>
            <div className="sidebar-sub">Dial · CRM · Intelligence</div>
          </div>

          <nav className="aeon-nav">
            {NAV_SECTIONS.map((section) => (
              <NavSectionGroup key={section.label} section={section} pathname={pathname} />
            ))}
          </nav>

          <div className="sidebar-footer">
            <div className="user-chip">
              <div className="user-avatar">DC</div>
              <div className="user-info">
                <div className="user-name">D. CRUZ</div>
                <div className="user-role">Ops Manager</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── TOPBAR ── */}
        <header className="aeon-topbar">
          <button
            className="sidebar-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label="Toggle sidebar"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
              stroke="currentColor" strokeWidth="1.4">
              <path d="M1 3h12M1 7h12M1 11h8" />
            </svg>
          </button>

          <div className="topbar-breadcrumb">
            <span className="bc-root">AEON</span>
            <span className="bc-sep">/</span>
            <span className="bc-current">{crumb}</span>
          </div>

          <div className="topbar-search-wrap">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"
              stroke="currentColor" strokeWidth="1.4">
              <circle cx="5" cy="5" r="3.5" /><line x1="7.5" y1="7.5" x2="11" y2="11" />
            </svg>
            <input
              className="topbar-search"
              type="text"
              placeholder="SEARCH SYSTEM..."
              spellCheck={false}
              autoComplete="off"
            />
          </div>

          <div className="topbar-actions">
            <button
              className="icon-btn"
              onClick={() => showToast('CALLBACK ALERT', 'Dave Holloway — 3rd attempt pending')}
              aria-label="Notifications"
            >
              <Icon d={ICONS.inbox} />
              <span className="notif-dot" />
            </button>
            <button className="icon-btn" aria-label="Settings">
              <Icon d={ICONS.settings} />
            </button>
            <div className="topbar-time">{time}</div>
          </div>
        </header>

        {/* ── PAGE CONTENT ── */}
        <main className="aeon-main">
          {children}
        </main>

        {/* ── STATUS BAR ── */}
        <footer className="aeon-statusbar">
          <div className="status-indicator">
            <div className="status-dot" />
            <span>SYSTEM: NOMINAL</span>
          </div>
          <div className="status-sep" />
          <span>VoIP: CONNECTED</span>
          <div className="status-sep" />
          <span>AGENTS: 3 ONLINE</span>
          <div className="status-sep" />
          <span>SESSION: {sessionId}</span>
          <div className="status-sep" />
          <span className="status-time">{time}</span>
        </footer>
      </div>

      {/* ── TOAST ── */}
      <div className={`aeon-toast${toastVisible ? ' show' : ''}`}>
        <div className="toast-title">{toastMsg.title}</div>
        <div className="toast-body">{toastMsg.body}</div>
      </div>
    </>
  )
}
