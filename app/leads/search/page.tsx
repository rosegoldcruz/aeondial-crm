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
  source?: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    company?: string;
    [key: string]: unknown;
  };
};

export default function LeadsSearchPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    let mounted = true;
    apiGet<LeadRecord[]>(`/leads?org_id=${encodeURIComponent(ORG_ID)}&limit=500`)
      .then((data) => {
        if (!mounted) return;
        setLeads(data);
      })
      .catch(() => {
        if (!mounted) return;
        setLeads([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return leads.filter((lead) => {
      const name = `${lead.metadata?.first_name || ""} ${lead.metadata?.last_name || ""}`.toLowerCase();
      const email = (lead.metadata?.email || "").toLowerCase();
      const phone = (lead.metadata?.phone || "").toLowerCase();
      const company = (lead.metadata?.company || "").toLowerCase();
      return name.includes(q) || email.includes(q) || phone.includes(q) || company.includes(q);
    });
  }, [leads, query]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Lead Search</h1>
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <Input className="pl-9" placeholder="Search leads" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
      </Card>

      <Card className="p-4">
        <div className="space-y-2">
          {filtered.map((lead) => (
            <div key={lead.lead_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">
                  {lead.metadata?.first_name || "Unknown"} {lead.metadata?.last_name || "Lead"}
                </div>
                <div className="text-neutral-500">
                  {(lead.metadata?.company as string) || "No company"} • {lead.metadata?.email || "No email"}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{lead.source || "unknown"}</Badge>
                <Badge>{lead.status}</Badge>
              </div>
            </div>
          ))}
          {filtered.length === 0 ? <div className="text-sm text-neutral-500">No matching leads.</div> : null}
        </div>
      </Card>
    </div>
  );
}
