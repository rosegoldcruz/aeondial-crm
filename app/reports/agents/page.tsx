"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type UserRecord = {
  user_id: string;
  full_name?: string;
  email: string;
  role: "owner" | "admin" | "agent";
  status: string;
};

type CallRecord = {
  call_id: string;
  status: string;
  metadata?: {
    agent_id?: string;
    disposition?: string;
    [key: string]: unknown;
  };
};

export default function AgentReportPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [userData, callData] = await Promise.all([
          apiGet<UserRecord[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`),
          apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
        ]);

        if (!mounted) return;
        setUsers(userData);
        setCalls(callData);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load agent report");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const reportRows = useMemo(() => {
    const byAgent = new Map<string, { total: number; completed: number; converted: number }>();

    for (const call of calls) {
      const agentId = call.metadata?.agent_id;
      if (!agentId) continue;

      if (!byAgent.has(agentId)) {
        byAgent.set(agentId, { total: 0, completed: 0, converted: 0 });
      }

      const row = byAgent.get(agentId)!;
      row.total += 1;
      if (call.status === "completed") row.completed += 1;
      if (call.metadata?.disposition === "converted") row.converted += 1;
    }

    return users
      .map((user) => {
        const stats = byAgent.get(user.user_id) || { total: 0, completed: 0, converted: 0 };
        const completionRate = stats.total ? Math.round((stats.completed / stats.total) * 100) : 0;
        const conversionRate = stats.completed ? Math.round((stats.converted / stats.completed) * 100) : 0;
        return {
          user,
          ...stats,
          completionRate,
          conversionRate,
        };
      })
      .sort((a, b) => b.total - a.total);
  }, [calls, users]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Agent Performance Reports</h1>
        <p className="text-sm text-neutral-500">Live stats from users and call event metadata.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Agent Leaderboard</h2>
        <div className="space-y-2">
          {reportRows.map((row) => (
            <div key={row.user.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{row.user.full_name || row.user.email}</div>
                <div className="text-neutral-500">{row.user.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Calls: {row.total}</Badge>
                <Badge variant="outline">Completion: {row.completionRate}%</Badge>
                <Badge>Conversion: {row.conversionRate}%</Badge>
              </div>
            </div>
          ))}
          {reportRows.length === 0 ? <div className="text-sm text-neutral-500">No agent data available.</div> : null}
        </div>
      </Card>
    </div>
  );
}
