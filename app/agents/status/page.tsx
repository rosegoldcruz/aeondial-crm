"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type UserRecord = {
  user_id: string;
  full_name?: string;
  email: string;
  role: string;
  status: string;
};

type CallRecord = {
  status: string;
  metadata?: { agent_id?: string; [key: string]: unknown };
};

export default function AgentStatusPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      apiGet<UserRecord[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`),
      apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
    ])
      .then(([userData, callData]) => {
        if (!mounted) return;
        setUsers(userData);
        setCalls(callData);
      })
      .catch(() => {
        if (!mounted) return;
        setUsers([]);
        setCalls([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const rows = useMemo(() => {
    const byAgent = new Map<string, { total: number; active: number }>();
    for (const call of calls) {
      const id = call.metadata?.agent_id;
      if (!id) continue;
      if (!byAgent.has(id)) byAgent.set(id, { total: 0, active: 0 });
      const current = byAgent.get(id)!;
      current.total += 1;
      if (call.status === "originated" || call.status === "bridged" || call.status === "transferred") {
        current.active += 1;
      }
    }

    return users.map((user) => ({
      ...user,
      totalCalls: byAgent.get(user.user_id)?.total || 0,
      activeCalls: byAgent.get(user.user_id)?.active || 0,
    }));
  }, [users, calls]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Agent Status Board</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{row.full_name || row.email}</div>
                <div className="text-neutral-500">{row.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{row.status}</Badge>
                <Badge variant="outline">Calls: {row.totalCalls}</Badge>
                <Badge>Active: {row.activeCalls}</Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-neutral-500">No agent status rows found.</div> : null}
        </div>
      </Card>
    </div>
  );
}
