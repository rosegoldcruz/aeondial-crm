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
};

type CallRecord = {
  metadata?: { agent_id?: string; [key: string]: unknown };
  status: string;
};

export default function AgentPerformancePage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    Promise.all([
      apiGet<UserRecord[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`),
      apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
    ])
      .then(([u, c]) => {
        if (!mounted) return;
        setUsers(u);
        setCalls(c);
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
    const byAgent = new Map<string, { total: number; completed: number }>();
    for (const call of calls) {
      const id = call.metadata?.agent_id;
      if (!id) continue;
      if (!byAgent.has(id)) byAgent.set(id, { total: 0, completed: 0 });
      const row = byAgent.get(id)!;
      row.total += 1;
      if (call.status === "completed") row.completed += 1;
    }

    return users
      .filter((u) => u.role === "agent" || u.role === "admin" || u.role === "owner")
      .map((u) => {
        const metric = byAgent.get(u.user_id) || { total: 0, completed: 0 };
        return {
          ...u,
          total: metric.total,
          completed: metric.completed,
          completionRate: metric.total ? Math.round((metric.completed / metric.total) * 100) : 0,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [calls, users]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Agent Performance</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{row.full_name || row.email}</div>
                <div className="text-neutral-500">{row.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Calls: {row.total}</Badge>
                <Badge variant="outline">Completed: {row.completed}</Badge>
                <Badge>{row.completionRate}%</Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-neutral-500">No performance data available.</div> : null}
        </div>
      </Card>
    </div>
  );
}
