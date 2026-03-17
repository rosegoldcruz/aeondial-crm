"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ORG_ID, USER_ID, apiGet, apiPost } from "@/lib/backend";

type CallRecord = {
  call_id: string;
  status: string;
  campaign_id: string;
  contact_id: string;
  metadata?: { agent_id?: string; [key: string]: unknown };
};

export default function AgentWorkspacePage() {
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=200`)
      .then((data) => {
        if (!mounted) return;
        setCalls(data);
      })
      .catch(() => {
        if (!mounted) return;
        setCalls([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const myCalls = useMemo(() => calls.filter((c) => c.metadata?.agent_id === USER_ID), [calls]);

  async function placeTestCall() {
    await apiPost("/telephony/calls/originate", {
      org_id: ORG_ID,
      agent_id: USER_ID,
      campaign_id: myCalls[0]?.campaign_id || "default-campaign",
      contact_id: myCalls[0]?.contact_id || "default-contact",
      direction: "outbound",
    });

    const refreshed = await apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=200`);
    setCalls(refreshed);
  }

  async function endCall(call: CallRecord) {
    await apiPost<{ success: boolean; call?: CallRecord }>("/telephony/calls/end", {
      org_id: ORG_ID,
      agent_id: USER_ID,
      campaign_id: call.campaign_id,
      contact_id: call.contact_id,
      call_id: call.call_id,
    });
    setCalls((prev) =>
      prev.map((c) => (c.call_id === call.call_id ? { ...c, status: "ended" } : c))
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Agent Workspace</h1>
        <Button onClick={placeTestCall}>Originate Test Call</Button>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">My Calls</h2>
        <div className="space-y-2">
          {myCalls.map((call) => (
            <div key={call.call_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{call.call_id}</div>
                <div className="text-neutral-500">Campaign: {call.campaign_id}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge>{call.status}</Badge>
                {!["ended", "completed", "transferred", "failed"].includes(call.status) && (
                  <Button size="sm" variant="destructive" onClick={() => endCall(call)}>
                    End
                  </Button>
                )}
              </div>
            </div>
          ))}
          {myCalls.length === 0 ? <div className="text-sm text-neutral-500">No calls assigned to this agent yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
