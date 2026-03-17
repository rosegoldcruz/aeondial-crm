"use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type CampaignRecord = {
  campaign_id: string;
  name?: string;
  status?: string;
};

type CallRecord = {
  call_id: string;
  campaign_id: string;
  status: string;
};

export default function CampaignReportsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [campaignData, callData] = await Promise.all([
          apiGet<CampaignRecord[]>(`/campaigns?org_id=${encodeURIComponent(ORG_ID)}`),
          apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
        ]);

        if (!mounted) return;
        setCampaigns(campaignData);
        setCalls(callData);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load campaign data");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const byCampaign = useMemo(() => {
    const grouped = new Map<string, { total: number; completed: number }>();

    for (const call of calls) {
      if (!grouped.has(call.campaign_id)) {
        grouped.set(call.campaign_id, { total: 0, completed: 0 });
      }
      const row = grouped.get(call.campaign_id)!;
      row.total += 1;
      if (call.status === "completed") row.completed += 1;
    }

    return campaigns.map((campaign) => {
      const metrics = grouped.get(campaign.campaign_id) || { total: 0, completed: 0 };
      const completionRate = metrics.total > 0 ? Math.round((metrics.completed / metrics.total) * 100) : 0;
      return {
        ...campaign,
        totalCalls: metrics.total,
        completedCalls: metrics.completed,
        completionRate,
      };
    });
  }, [calls, campaigns]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Campaign Reports</h1>
        <p className="text-sm text-neutral-500">Real campaign outcomes derived from telephony activity.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Target className="h-4 w-4" /> Campaigns</div>
          <div className="mt-2 text-2xl font-semibold">{campaigns.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><BarChart3 className="h-4 w-4" /> Calls Tracked</div>
          <div className="mt-2 text-2xl font-semibold">{calls.length}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Per-Campaign Performance</h2>
        <div className="space-y-2">
          {byCampaign.map((campaign) => (
            <div
              key={campaign.campaign_id}
              className="flex items-center justify-between rounded-md border p-3 text-sm"
            >
              <div>
                <div className="font-medium">{campaign.name || campaign.campaign_id}</div>
                <div className="text-neutral-500">ID: {campaign.campaign_id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Calls: {campaign.totalCalls}</Badge>
                <Badge variant="outline">Completed: {campaign.completedCalls}</Badge>
                <Badge>{campaign.completionRate}%</Badge>
              </div>
            </div>
          ))}
          {campaigns.length === 0 ? <div className="text-sm text-neutral-500">No campaigns found.</div> : null}
        </div>
      </Card>
    </div>
  );
}
