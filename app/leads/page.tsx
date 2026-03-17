"use client";

import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ORG_ID, apiGet } from "@/lib/backend";

type LeadRecord = {
  lead_id: string;
  status: string;
  score?: number;
  source?: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    email?: string;
    [key: string]: unknown;
  };
  created_at?: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await apiGet<LeadRecord[]>(`/leads?org_id=${encodeURIComponent(ORG_ID)}&limit=500`);
        if (!mounted) return;
        setLeads(data);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load leads");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return leads.filter((lead) => {
      const fullName = `${lead.metadata?.first_name || ""} ${lead.metadata?.last_name || ""}`.toLowerCase();
      const email = (lead.metadata?.email || "").toLowerCase();
      const phone = lead.metadata?.phone || "";
      return fullName.includes(q) || email.includes(q) || phone.includes(q) || lead.status.toLowerCase().includes(q);
    });
  }, [leads, search]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Lead Lists</h1>
        <p className="text-sm text-neutral-500">Org-scoped leads loaded from backend records.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            placeholder="Search by name, email, phone, or status"
          />
        </div>
      </Card>

      <Card className="p-4">
        <div className="mb-3 text-sm text-neutral-500">Showing {filtered.length} of {leads.length} leads</div>
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div key={lead.lead_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">
                  {lead.metadata?.first_name || "Unknown"} {lead.metadata?.last_name || "Lead"}
                </div>
                <div className="text-neutral-500">
                  {lead.metadata?.email || "No email"} • {lead.metadata?.phone || "No phone"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lead.source || "unknown"}</Badge>
                <Badge>{lead.status}</Badge>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <div className="text-sm text-neutral-500">No leads found.</div> : null}
        </div>
      </Card>
    </div>
  );
}
