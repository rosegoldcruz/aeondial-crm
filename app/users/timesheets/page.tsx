"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type UserRecord = {
  user_id: string;
  full_name?: string;
  email: string;
  status: string;
};

type CallRecord = {
  call_id: string;
  metadata?: { agent_id?: string; [key: string]: unknown };
  status: string;
};

export default function TimesheetsPage() {
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
    const byAgent = new Map<string, number>();
    for (const call of calls) {
      const id = call.metadata?.agent_id;
      if (!id) continue;
      byAgent.set(id, (byAgent.get(id) || 0) + 1);
    }

    return users.map((u) => ({
      ...u,
      handledCalls: byAgent.get(u.user_id) || 0,
      estimatedTalkMinutes: (byAgent.get(u.user_id) || 0) * 4,
    }));
  }, [calls, users]);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">User Timesheets</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{row.full_name || row.email}</div>
                <div className="text-neutral-500">{row.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Calls: {row.handledCalls}</Badge>
                <Badge variant="outline">~{row.estimatedTalkMinutes}m</Badge>
                <Badge>{row.status}</Badge>
              </div>
            </div>
          ))}
          {rows.length === 0 ? <div className="text-sm text-neutral-500">No user activity available.</div> : null}
        </div>
      </Card>
    </div>
  );
}
