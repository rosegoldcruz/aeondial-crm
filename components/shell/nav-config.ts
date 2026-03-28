export interface NavItem {
  label: string
  href: string
  badge?: string | number
  badgeVariant?: 'default' | 'hot'
  icon: string // svg path data
}

export interface NavSection {
  label: string
  items: NavItem[]
  collapsible?: boolean
}

// SVG path data strings for icons (14x14 viewBox)
export const ICONS = {
  grid:       'M1 1h5v5H1zM8 1h5v5H8zM1 8h5v5H1zM8 8h5v5H8z',
  terminal:   'M1 1h12v12H1zM4 5l2 2-2 2M7 9h3',
  phone:      'M3 1.5C3 1.5 5 3.5 5 5.5c0 .8-.5 1.5-1 2l1.5 1.5c.5-.5 1.2-1 2-1 2 0 3.5 2 3.5 2L9.5 11.5C7 10 4.5 7.5 3 5L3 1.5z',
  users:      'M5 6a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM1 13c0-2.8 1.8-4.5 4-4.5s4 1.7 4 4.5M10 5a2 2 0 11.001 0M12 12c0-2-1-3.5-2.5-4',
  zap:        'M8 1L4 8h5l-3 5',
  target:     'M7 1a6 6 0 100 12A6 6 0 007 1zM7 4a3 3 0 100 6 3 3 0 000-6zM7 6.5h.01',
  chart:      'M1 10l3-4 3 2 3-5 3 2M1 12h12',
  bot:        'M5 1h4v3H5zM7 4v2M3 6h8v6H3zM5 9h.5M8.5 9H9M5 12v2M9 12v2',
  fox:        'M2 2l3 4-3 3h2l2-2 2 2h2l-3-3 3-4H7L5 5 3 2H2z',
  star:       'M7 1l1.8 3.6L13 5.3l-3 2.9.7 4.1L7 10.3l-3.7 1.9.7-4.1-3-2.9 4.2-.7z',
  calendar:   'M1 4h12v9H1zM1 4V2h12v2M4 1v3M10 1v3M4 7h2M7 7h3M4 10h2',
  settings:   'M7 1C4.8 1 3 2.8 3 5v.5L1 7l2 1.5V9c0 2.2 1.8 4 4 4s4-1.8 4-4v-.5L13 7l-2-1.5V5c0-2.2-1.8-4-4-4zM5.5 7a1.5 1.5 0 103 0 1.5 1.5 0 00-3 0',
  shield:     'M7 1L2 3v4c0 3.3 2.3 5.5 5 6 2.7-.5 5-2.7 5-6V3L7 1z',
  dollar:     'M7 1v12M4.5 3.5C4.5 2 5.5 1 7 1s2.5 1 2.5 2.5S8.5 6 7 6s-2.5 1-2.5 2.5S5.5 11 7 11s2.5-1 2.5-2.5',
  layers:     'M7 1L1 4l6 3 6-3-6-3zM1 7l6 3 6-3M1 10l6 3 6-3',
  link:       'M5 7a2 2 0 003 0l3-3a2 2 0 00-3-3L6.5 3.5M9 7a2 2 0 00-3 0l-3 3a2 2 0 003 3L7.5 10.5',
  clock:      'M7 1a6 6 0 100 12A6 6 0 007 1zM7 4v3.5l2.5 1.5',
  compass:    'M7 1a6 6 0 100 12A6 6 0 007 1zM9.5 4.5l-1.8 4.2-4.2 1.8 1.8-4.2 4.2-1.8z',
  megaphone:  'M12 3v8L7 9H3a2 2 0 010-4h4l5-2zM7 9v3',
  admin:      'M7 1l1.5 3H12l-2.5 2 1 3L7 7.5 4.5 9l1-3L3 4h3.5z',
  server:     'M1 3h12v3H1zM1 8h12v3H1zM4 5h.5M4 10h.5M7 5h.5M7 10h.5',
  list:       'M1 3h12M1 7h12M1 11h8',
  upload:     'M7 1v8M4 4l3-3 3 3M1 11v2h12v-2',
  inbox:      'M1 4h12l-2 7H3L1 4zM1 4L4 8h6l3-4',
  funnel:     'M1 2h12L8 8v5l-2-1V8L1 2z',
  repeat:     'M3 4H1V1M3 4C3 4 5 1 9 1c3 0 4 2 4 2M11 10h2v3M11 10c0 0-2 3-6 3-3 0-4-2-4-2',
  eye:        'M1 7s2-5 6-5 6 5 6 5-2 5-6 5-6-5-6-5zM7 5a2 2 0 100 4 2 2 0 000-4z',
  tag:        'M1 1h5l7 7-5 5-7-7V1zM4 4h.5',
}

export const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Core',
    items: [
      { label: 'Dashboard',      href: '/dashboard',       icon: ICONS.grid },
      { label: 'Command Center', href: '/command-center',  icon: ICONS.terminal },
      { label: 'Operations',     href: '/operations',      icon: ICONS.compass },
    ],
  },
  {
    label: 'Dialer',
    items: [
      { label: 'Dialer',         href: '/dialer',          icon: ICONS.phone,  badge: 'LIVE', badgeVariant: 'hot' },
      { label: 'Outbound',       href: '/outbound',        icon: ICONS.zap },
      { label: 'Campaigns',      href: '/campaigns',       icon: ICONS.megaphone },
      { label: 'Lists',          href: '/lists',           icon: ICONS.list },
    ],
  },
  {
    label: 'Leads & CRM',
    items: [
      { label: 'Leads',          href: '/leads',           icon: ICONS.inbox },
      { label: 'Opportunities',  href: '/opportunities',   icon: ICONS.star },
      { label: 'Contacts',       href: '/users',           icon: ICONS.users },
      { label: 'Calendars',      href: '/calendars',       icon: ICONS.calendar },
    ],
  },
  {
    label: 'Automation',
    items: [
      { label: 'Automation',     href: '/automation',      icon: ICONS.repeat },
      { label: 'Triggers',       href: '/automation/triggers', icon: ICONS.zap },
    ],
  },
  {
    label: 'Agents',
    collapsible: true,
    items: [
      { label: 'All Agents',     href: '/agents',          icon: ICONS.users },
      { label: 'Performance',    href: '/agents/performance', icon: ICONS.chart },
      { label: 'Status Board',   href: '/agents/status',   icon: ICONS.eye },
      { label: 'Timeclock',      href: '/agents/timeclock',icon: ICONS.clock },
      { label: 'Workspace',      href: '/agents/workspace',icon: ICONS.layers },
      { label: 'Agent Network',  href: '/agent-network',   icon: ICONS.link },
    ],
  },
  {
    label: '🦊 Fox Intelligence',
    items: [
      { label: 'Fox Studio',     href: '/fox/studio',      icon: ICONS.fox, badge: 'AI', badgeVariant: 'hot' },
      { label: 'Fox Agents',     href: '/fox/agents',      icon: ICONS.bot },
      { label: 'AI Agents',      href: '/ai-agents',       icon: ICONS.star },
      { label: 'Intelligence',   href: '/intelligence',    icon: ICONS.target },
    ],
  },
  {
    label: 'Reports',
    collapsible: true,
    items: [
      { label: 'Overview',       href: '/reports',         icon: ICONS.chart },
      { label: 'Realtime',       href: '/reports/realtime',icon: ICONS.zap, badge: 'LIVE', badgeVariant: 'hot' },
      { label: 'Calls',          href: '/reports/calls',   icon: ICONS.phone },
      { label: 'Campaigns',      href: '/reports/campaigns',icon: ICONS.megaphone },
      { label: 'Agents',         href: '/reports/agents',  icon: ICONS.users },
    ],
  },
  {
    label: 'Finance & Marketing',
    collapsible: true,
    items: [
      { label: 'Payments',       href: '/payments',        icon: ICONS.dollar },
      { label: 'Memberships',    href: '/memberships',     icon: ICONS.star },
      { label: 'Social Planner', href: '/marketing/social-planner', icon: ICONS.megaphone },
      { label: 'Funnels',        href: '/sites/funnels',   icon: ICONS.funnel },
      { label: 'Reputation',     href: '/reputation',      icon: ICONS.shield },
    ],
  },
  {
    label: 'System',
    collapsible: true,
    items: [
      { label: 'Integrations',   href: '/integrations',    icon: ICONS.link },
      { label: 'Compliance',     href: '/compliance',      icon: ICONS.shield },
      { label: 'Settings',       href: '/settings',        icon: ICONS.settings },
      { label: 'Admin',          href: '/admin',           icon: ICONS.admin },
    ],
  },
]
