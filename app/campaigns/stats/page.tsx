"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type CampaignRecord = {
  campaign_id: string;
  name?: string;
  status?: string;
};

type CallRecord = {
  campaign_id: string;
  status: string;
};

export default function CampaignStatsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiGet<CampaignRecord[]>(`/campaigns?org_id=${encodeURIComponent(ORG_ID)}`),
      apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
    ])
      .then(([c, callsData]) => {
        if (!mounted) return;
        setCampaigns(c);
        setCalls(callsData);
      })
      .catch(() => {
        if (!mounted) return;
        setCampaigns([]);
        setCalls([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const grouped = new Map<string, { total: number; completed: number }>();
    for (const call of calls) {
      if (!grouped.has(call.campaign_id)) grouped.set(call.campaign_id, { total: 0, completed: 0 });
      const item = grouped.get(call.campaign_id)!;
      item.total += 1;
      if (call.status === "completed") item.completed += 1;
    }

    return campaigns.map((campaign) => {
      const g = grouped.get(campaign.campaign_id) || { total: 0, completed: 0 };
      const completion = g.total ? Math.round((g.completed / g.total) * 100) : 0;
      return { ...campaign, total: g.total, completed: g.completed, completion };
    });
  }, [campaigns, calls]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Campaign Stats</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.campaign_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{row.name || row.campaign_id}</div>
                <div className="text-neutral-500">{row.campaign_id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Calls: {row.total}</Badge>
                <Badge variant="outline">Completed: {row.completed}</Badge>
                <Badge>{row.completion}%</Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-neutral-500">No campaigns available.</div> : null}
        </div>
      </Card>
    </div>
  );
}
