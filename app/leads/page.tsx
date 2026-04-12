"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Phone, Plus, AlertCircle } from "lucide-react"
import { Input } from "@/components/ui/input"
import { ORG_ID, apiGet } from "@/lib/backend"
import Link from "next/link"

/* ── Real DB shape ──────────────────────────────────────────────── */

type LeadRecord = {
  lead_id: string
  org_id: string
  contact_id: string | null
  campaign_id: string | null
  status: string
  stage: string | null
  score: number | null
  source: string | null
  metadata: {
    lead_name?: string
    phone?: string
    first_name?: string
    last_name?: string
    email?: string
    [key: string]: unknown
  } | null
  attempt_count: number
  do_not_call: boolean
  created_at: string
  last_called_at: string | null
  last_agent_disposition: string | null
  last_system_outcome: string | null
}

/* ── StatusBadge ────────────────────────────────────────────────── */

const STATUS_COLORS: Record<string, string> = {
  new:          "bg-blue-500/15 text-blue-400 border-blue-500/20",
  contacted:    "bg-yellow-500/15 text-yellow-400 border-yellow-500/20",
  qualified:    "bg-green-500/15 text-green-400 border-green-500/20",
  converted:    "bg-[#FF6B35]/15 text-[#FF6B35] border-[#FF6B35]/20",
  unqualified:  "bg-red-500/15 text-red-400 border-red-500/20",
  dnc:          "bg-red-900/30 text-red-300 border-red-800/30",
  failed:       "bg-red-500/15 text-red-400 border-red-500/20",
  callback:     "bg-purple-500/15 text-purple-400 border-purple-500/20",
}

function StatusBadge({ status }: { status: string | null | undefined }) {
  const raw = status ?? "new"
  const normalized = raw.toLowerCase()
  const colors = STATUS_COLORS[normalized]
    ?? "bg-[#1a1a1a] text-[#737373] border-[#262626]"
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${colors}`}>
      {raw.toUpperCase()}
    </span>
  )
}

/* ── Helpers ────────────────────────────────────────────────────── */

function getLeadName(lead: LeadRecord): string {
  if (lead.metadata?.lead_name) return lead.metadata.lead_name
  const first = lead.metadata?.first_name || ""
  const last = lead.metadata?.last_name || ""
  const full = `${first} ${last}`.trim()
  return full || "Unknown Lead"
}

function getLeadPhone(lead: LeadRecord): string | null {
  return lead.metadata?.phone || null
}

/* ── Page ───────────────────────────────────────────────────────── */

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([])
  const [search, setSearch] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        const data = await apiGet<LeadRecord[]>(
          `/leads?org_id=${encodeURIComponent(ORG_ID)}&limit=500`
        )
        if (!mounted) return
        setLeads(data)
      } catch (e) {
        if (!mounted) return
        setError(e instanceof Error ? e.message : "Failed to load leads")
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()
    return () => { mounted = false }
  }, [])

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return leads
    return leads.filter((lead) => {
      const name = getLeadName(lead).toLowerCase()
      const phone = getLeadPhone(lead) || ""
      const email = (lead.metadata?.email || "").toLowerCase()
      return (
        name.includes(q) ||
        phone.includes(q) ||
        email.includes(q) ||
        lead.status.toLowerCase().includes(q)
      )
    })
  }, [leads, search])

  return (
    <div className="min-h-screen" style={{ background: "var(--cyber-bg-darkest, #0a0a0f)" }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-[#262626]">
        <div>
          <h1 className="text-xl font-bold text-white">Leads</h1>
          <p className="text-xs text-[#525252] mt-0.5">
            {loading ? "Loading…" : `${filtered.length} total`}
          </p>
        </div>
        <Link
          href="/leads/new"
          className="hidden md:flex items-center gap-2 px-4 py-2
            bg-[#FF6B35] text-white text-sm font-medium rounded-lg
            hover:bg-[#e55a2b] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Lead
        </Link>
      </div>

      {/* Search */}
      <div className="px-4 md:px-6 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#525252]" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-[#111111] border-[#262626] text-white placeholder:text-[#525252]"
            placeholder="Search by name, phone, or status…"
          />
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mx-4 md:mx-6 mb-4 flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center px-4">
          <div className="w-16 h-16 rounded-full bg-[#1a1a1a] flex items-center justify-center mb-4">
            <Search className="w-7 h-7 text-[#525252]" />
          </div>
          <p className="text-white font-medium mb-1">
            {search ? "No matching leads" : "No leads yet"}
          </p>
          <p className="text-[#525252] text-sm max-w-xs">
            {search
              ? "Try adjusting your search terms."
              : "Import leads or add them manually to get started."}
          </p>
        </div>
      )}

      {/* ── Desktop Table ─────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="hidden md:block px-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#262626] text-[#525252] text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Name</th>
                <th className="px-4 py-3 text-left">Phone</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Source</th>
                <th className="px-4 py-3 text-left">Attempts</th>
                <th className="px-4 py-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {filtered.map((lead) => (
                <tr key={lead.lead_id} className="hover:bg-[#111111] transition-colors">
                  <td className="px-4 py-3 text-white font-medium">
                    {getLeadName(lead)}
                    {lead.do_not_call && (
                      <span className="ml-2 text-[10px] text-red-400 font-semibold">DNC</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3]">
                    {getLeadPhone(lead) || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} />
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3]">
                    {lead.source || "—"}
                  </td>
                  <td className="px-4 py-3 text-[#a3a3a3]">
                    {lead.attempt_count}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/leads/${lead.lead_id}`}
                      className="text-[#FF6B35] text-xs hover:underline"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Mobile Cards ──────────────────────────────────────── */}
      {filtered.length > 0 && (
        <div className="md:hidden space-y-3 px-4 pt-2 pb-28">
          {filtered.map((lead) => {
            const phone = getLeadPhone(lead)
            return (
              <Link
                key={lead.lead_id}
                href={`/leads/${lead.lead_id}`}
                className="block bg-[#111111] border border-[#1e1e1e]
                  rounded-xl p-4 active:bg-[#1a1a1a] transition-colors"
              >
                {/* Row 1: Name + Status */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white font-semibold text-sm truncate mr-2">
                    {getLeadName(lead)}
                    {lead.do_not_call && (
                      <span className="ml-1.5 text-[10px] text-red-400 font-semibold">DNC</span>
                    )}
                  </span>
                  <StatusBadge status={lead.status} />
                </div>

                {/* Row 2: Phone */}
                <div className="flex items-center gap-2 text-[#737373] text-xs mb-2">
                  <Phone className="w-3 h-3" />
                  <span>{phone || "No phone"}</span>
                </div>

                {/* Row 3: Source tag */}
                {lead.source && (
                  <div className="inline-flex items-center gap-1
                    bg-[#FF6B35]/10 border border-[#FF6B35]/20
                    text-[#FF6B35] text-[10px] font-medium
                    px-2 py-0.5 rounded-full">
                    <span>{lead.source}</span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Mobile FAB ────────────────────────────────────────── */}
      <div className="md:hidden">
        <Link
          href="/leads/new"
          className="fixed bottom-20 right-4 z-40
            w-14 h-14 bg-[#FF6B35] rounded-full
            flex items-center justify-center
            shadow-[0_4px_24px_rgba(255,107,53,0.4)]
            active:scale-95 transition-transform"
          aria-label="Add new lead"
        >
          <Plus className="w-6 h-6 text-white" />
        </Link>
      </div>
    </div>
  )
}
