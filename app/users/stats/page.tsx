"use client";

import { useEffect, useMemo, useState } from "react";
import { Clock, Phone, UserCheck, Users } from "lucide-react";
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
    [key: string]: unknown;
  };
};

export default function UserStatsPage() {
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
        setError(e instanceof Error ? e.message : "Failed to load user stats");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const online = users.filter((u) => u.status === "active").length;
    const byAgent = new Map<string, number>();

    for (const call of calls) {
      const agentId = call.metadata?.agent_id;
      if (!agentId) continue;
      byAgent.set(agentId, (byAgent.get(agentId) || 0) + 1);
    }

    const top = users
      .map((user) => ({
        ...user,
        callsHandled: byAgent.get(user.user_id) || 0,
      }))
      .sort((a, b) => b.callsHandled - a.callsHandled);

    return {
      online,
      total: users.length,
      totalCalls: calls.length,
      top,
    };
  }, [calls, users]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">User Stats</h1>
        <p className="text-sm text-neutral-500">Live productivity and status by org-scoped users.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Users className="h-4 w-4" /> Team Size</div>
          <div className="mt-2 text-2xl font-semibold">{metrics.total}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><UserCheck className="h-4 w-4" /> Active</div>
          <div className="mt-2 text-2xl font-semibold">{metrics.online}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Phone className="h-4 w-4" /> Calls Logged</div>
          <div className="mt-2 text-2xl font-semibold">{metrics.totalCalls}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Clock className="h-4 w-4" /> Coverage</div>
          <div className="mt-2 text-2xl font-semibold">
            {metrics.total > 0 ? Math.round((metrics.online / metrics.total) * 100) : 0}%
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Top Agents by Calls</h2>
        <div className="space-y-2">
          {metrics.top.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{user.full_name || user.email}</div>
                <div className="text-neutral-500">{user.role}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.status}</Badge>
                <Badge>Calls: {user.callsHandled}</Badge>
              </div>
            </div>
          ))}
          {metrics.top.length === 0 ? <div className="text-sm text-neutral-500">No users found.</div> : null}
        </div>
      </Card>
    </div>
  );
}
