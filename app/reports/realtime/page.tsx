"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, Phone, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { BACKEND_URL, ORG_ID, apiGet, toWebSocketUrl } from "@/lib/backend";

type CallRecord = {
  call_id: string;
  status: string;
  direction: "inbound" | "outbound";
  campaign_id: string;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

type CampaignRecord = {
  campaign_id: string;
  name?: string;
  status?: string;
};

type QueueMetrics = {
  queue_depth?: number;
  active_workers?: number;
};

type WsEvent = {
  type?: string;
  event?: {
    category?: string;
    org_id?: string;
    payload?: Record<string, unknown>;
  };
};

export default function RealtimeReportsPage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [queueMetrics, setQueueMetrics] = useState<QueueMetrics>({});
  const [lastEvent, setLastEvent] = useState("No events yet");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [callData, campaignData] = await Promise.all([
          apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=200`),
          apiGet<CampaignRecord[]>(`/campaigns?org_id=${encodeURIComponent(ORG_ID)}`),
        ]);

        if (!mounted) return;
        setCalls(callData);
        setCampaigns(campaignData);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load realtime data");
      }
    }

    load();
    const interval = window.setInterval(load, 10000);

    return () => {
      mounted = false;
      window.clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    const ws = new WebSocket(`${toWebSocketUrl(BACKEND_URL)}/ws?org_id=${encodeURIComponent(ORG_ID)}`);

    ws.onmessage = (message) => {
      try {
        const parsed = JSON.parse(message.data) as WsEvent;
        if (parsed.type !== "event" || !parsed.event || parsed.event.org_id !== ORG_ID) {
          return;
        }

        const category = parsed.event.category || "unknown";
        setLastEvent(category);

        if (category === "queue.metrics") {
          setQueueMetrics((parsed.event.payload || {}) as QueueMetrics);
        }

        if (category === "call.event") {
          const payload = (parsed.event.payload || {}) as Partial<CallRecord>;
          if (!payload.call_id) return;
          const callId = payload.call_id;

          setCalls((prev) => {
            const idx = prev.findIndex((c) => c.call_id === callId);
            if (idx === -1) {
              return [
                {
                  call_id: callId,
                  status: payload.status || "unknown",
                  direction: (payload.direction as "inbound" | "outbound") || "outbound",
                  campaign_id: payload.campaign_id || "unknown",
                  metadata: payload.metadata || {},
                },
                ...prev,
              ].slice(0, 200);
            }

            const next = [...prev];
            next[idx] = {
              ...next[idx],
              ...payload,
            } as CallRecord;
            return next;
          });
        }
      } catch {
        // Ignore malformed websocket payloads.
      }
    };

    return () => ws.close();
  }, []);

  const stats = useMemo(() => {
    const activeCalls = calls.filter((c) => ["originated", "bridged", "transferred"].includes(c.status)).length;
    const completedCalls = calls.filter((c) => c.status === "completed").length;
    const inboundCalls = calls.filter((c) => c.direction === "inbound").length;
    return {
      activeCalls,
      completedCalls,
      inboundCalls,
      campaignCount: campaigns.length,
    };
  }, [calls, campaigns]);

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Realtime Reports</h1>
          <p className="text-sm text-neutral-500">Live call and queue telemetry from backend + websocket events.</p>
        </div>
        <Badge variant="outline">Last event: {lastEvent}</Badge>
      </div>

      {error ? (
        <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Phone className="h-4 w-4" /> Active Calls</div>
          <div className="mt-2 text-2xl font-semibold">{stats.activeCalls}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><TrendingUp className="h-4 w-4" /> Completed</div>
          <div className="mt-2 text-2xl font-semibold">{stats.completedCalls}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Users className="h-4 w-4" /> Inbound</div>
          <div className="mt-2 text-2xl font-semibold">{stats.inboundCalls}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Activity className="h-4 w-4" /> Queue Depth</div>
          <div className="mt-2 text-2xl font-semibold">{queueMetrics.queue_depth || 0}</div>
          <div className="text-xs text-neutral-500">Workers: {queueMetrics.active_workers || 0}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Recent Calls</h2>
        <div className="space-y-2">
          {calls.slice(0, 20).map((call) => (
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
          {calls.length === 0 ? <div className="text-sm text-neutral-500">No call activity yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
