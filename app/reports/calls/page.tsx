"use client";

import { useEffect, useMemo, useState } from "react";
import { Phone, PhoneIncoming, PhoneOutgoing } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type CallRecord = {
  call_id: string;
  status: string;
  direction: "inbound" | "outbound";
  campaign_id: string;
  created_at?: string;
  metadata?: Record<string, unknown>;
};

export default function CallsReportPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const data = await apiGet<CallRecord[]>(
          `/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`,
        );
        if (!mounted) return;
        setCalls(data);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load calls report");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const totals = useMemo(() => {
    const inbound = calls.filter((c) => c.direction === "inbound").length;
    const outbound = calls.filter((c) => c.direction === "outbound").length;
    const completed = calls.filter((c) => c.status === "completed").length;
    return { inbound, outbound, completed };
  }, [calls]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Calls Report</h1>
        <p className="text-sm text-neutral-500">Live call ledger for the selected org scope.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Phone className="h-4 w-4" /> Total Calls</div>
          <div className="mt-2 text-2xl font-semibold">{calls.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><PhoneIncoming className="h-4 w-4" /> Inbound</div>
          <div className="mt-2 text-2xl font-semibold">{totals.inbound}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><PhoneOutgoing className="h-4 w-4" /> Outbound</div>
          <div className="mt-2 text-2xl font-semibold">{totals.outbound}</div>
          <div className="text-xs text-neutral-500">Completed: {totals.completed}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Recent Calls</h2>
        <div className="space-y-2">
          {calls.slice(0, 100).map((call) => (
            <div key={call.call_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{call.call_id}</div>
                <div className="text-neutral-500">Campaign: {call.campaign_id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{call.direction}</Badge>
                <Badge>{call.status}</Badge>
              </div>
            </div>
          ))}
          {calls.length === 0 ? <div className="text-sm text-neutral-500">No calls found for this org.</div> : null}
        </div>
      </Card>
    </div>
  );
}
