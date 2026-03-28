# AEON Shell — Drop-In Integration Guide
## aeondial-crm @ /root/aeon/aeondial-crm

Zero pages broken. 3 files touched. All 72 routes inherit the new UI automatically.

---

## WHAT THIS IS

A root-level layout shell for Next.js App Router.
Every page.tsx you already have gets wrapped in the new AEON sidebar + topbar + statusbar
without any changes to the pages themselves.

---

## STEP 1 — Copy the new files into the repo

```bash
# From your local machine or VPS
cp aeon-globals.css     /root/aeon/aeondial-crm/app/aeon-globals.css
cp AppShell.tsx         /root/aeon/aeondial-crm/components/shell/AppShell.tsx
cp nav-config.ts        /root/aeon/aeondial-crm/components/shell/nav-config.ts
```

---

## STEP 2 — Update app/layout.tsx

Replace your existing `app/layout.tsx` with the new one, OR manually add these two lines:

```tsx
// Add this import (AFTER your existing globals.css import)
import './aeon-globals.css'

// Wrap children in AppShell
import AppShell from '@/components/shell/AppShell'

// In the return:
<body>
  <AppShell>{children}</AppShell>
</body>
```

DO NOT remove your existing `import './globals.css'` — the AEON styles are additive.

---

## STEP 3 — Install no new dependencies

AppShell uses only:
- `next/link`        ← already in your project
- `next/navigation`  ← already in your project
- `react`            ← already in your project

Zero new packages.

---

## STEP 4 — Restart dev server

```bash
cd /root/aeon/aeondial-crm
pm2 restart aeondial-crm
# or if running locally:
npm run dev
```

---

## WHAT CHANGES / WHAT DOESN'T

| File | Status |
|------|--------|
| `app/layout.tsx` | MODIFIED — adds AppShell wrapper + aeon-globals import |
| `app/globals.css` | UNTOUCHED — your existing styles are preserved |
| `app/aeon-globals.css` | NEW FILE — all AEON tokens and shell styles |
| `components/shell/AppShell.tsx` | NEW FILE — sidebar, topbar, statusbar |
| `components/shell/nav-config.ts` | NEW FILE — all 72 routes organized |
| Every `page.tsx` file | UNTOUCHED — zero changes |
| Your existing components | UNTOUCHED |
| Your existing API routes | UNTOUCHED |
| Database / backend | UNTOUCHED |

---

## LOGIN / REGISTER PAGES

AppShell auto-detects `/login` and `/register` routes and renders them naked
(no sidebar, no shell). Your existing auth pages show as-is.

If you have other auth routes that need the naked treatment, add them here in AppShell.tsx:

```tsx
// In AppShell.tsx, find this line:
if (pathname === '/login' || pathname === '/register') {
  return <>{children}</>
}

// Add any other naked routes:
if (['/login', '/register', '/forgot-password'].includes(pathname)) {
  return <>{children}</>
}
```

---

## MAKING YOUR EXISTING PAGES LOOK RIGHT

Your existing page content will appear inside the `.aeon-main` content area.
Pages with their own background colors or full-viewport layouts may need minor adjustments.

Use these utility classes in your page.tsx files for consistent AEON styling:

```tsx
// Page header pattern
<div className="aeon-page-header">
  <div>
    <div className="aeon-page-tag">Section Label</div>
    <h1 className="aeon-page-title">PAGE TITLE</h1>
  </div>
  <div className="aeon-page-actions">
    <button className="aeon-btn ghost"><span>Secondary</span></button>
    <button className="aeon-btn"><span>Primary Action</span></button>
  </div>
</div>

// Card
<div className="aeon-card">
  ...content
</div>

// Metrics grid
<div className="aeon-metrics-grid">
  <div className="aeon-metric-card">
    <div className="aeon-metric-label">Revenue</div>
    <div className="aeon-metric-val">$284K</div>
    <div className="aeon-metric-delta up">↑ 12%</div>
  </div>
</div>

// Table
<table className="aeon-table">
  <thead><tr><th>Name</th><th>Status</th></tr></thead>
  <tbody>
    <tr><td>Marcus Webb</td><td><span className="aeon-badge hot">Hot</span></td></tr>
  </tbody>
</table>
```

---

## ADDING TO NAV

All 72 routes are already in `nav-config.ts`.
To add a new route, just add it to the appropriate section:

```ts
// In nav-config.ts
{
  label: 'Dialer',
  items: [
    { label: 'New Route', href: '/new-route', icon: ICONS.zap },
    // ...
  ]
}
```

---

## GIT WORKFLOW (safe)

```bash
# Create a branch — don't push to main until tested
git checkout -b feature/aeon-shell-ui

# Copy in the 3 new files
# Update layout.tsx
# Test all routes

git add .
git commit -m "feat: AEON shell UI — sidebar, topbar, statusbar"
git push origin feature/aeon-shell-ui

# Only merge to main once visually verified
```

---

## ROLLBACK (if needed)

```bash
# Instant rollback — just revert layout.tsx
git checkout main -- app/layout.tsx

# Or delete the 3 new files and revert layout.tsx
rm app/aeon-globals.css
rm components/shell/AppShell.tsx
rm components/shell/nav-config.ts
git checkout main -- app/layout.tsx
```

Since we only added new files and modified layout.tsx, rollback is trivial.
