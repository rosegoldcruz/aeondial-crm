"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ORG_ID, USER_ID, apiGet, apiPost } from "@/lib/backend";

type UserRecord = {
  user_id: string;
  full_name?: string;
  email: string;
  status: string;
};

type CallRecord = {
  metadata?: { agent_id?: string; [key: string]: unknown };
};

export default function TimeclockPage() {
  const [clockedIn, setClockedIn] = useState(false);
  const [startedAt, setStartedAt] = useState<Date | null>(null);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);

  useEffect(() => {
    Promise.all([
      apiGet<UserRecord[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`),
      apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=500`),
    ])
      .then(([u, c]) => {
        setUsers(u);
        setCalls(c);
      })
      .catch(() => {
        setUsers([]);
        setCalls([]);
      });
  }, []);

  const myCalls = useMemo(() => calls.filter((c) => c.metadata?.agent_id === USER_ID).length, [calls]);

  async function toggleClock() {
    if (!clockedIn) {
      setClockedIn(true);
      setStartedAt(new Date());
      return;
    }

    await apiPost("/ai/events", {
      org_id: ORG_ID,
      event_type: "timeclock.clockout",
      payload: {
        user_id: USER_ID,
        started_at: startedAt?.toISOString() || null,
        ended_at: new Date().toISOString(),
      },
    });

    setClockedIn(false);
    setStartedAt(null);
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Timeclock</h1>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-sm text-neutral-500">Team Members</div>
          <div className="mt-2 text-2xl font-semibold">{users.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-neutral-500">My Calls Logged</div>
          <div className="mt-2 text-2xl font-semibold">{myCalls}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-neutral-500">Clock Status</div>
          <div className="mt-2">
            <Badge>{clockedIn ? "Clocked In" : "Clocked Out"}</Badge>
          </div>
        </Card>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Current Session</div>
            <div className="text-sm text-neutral-500">{startedAt ? startedAt.toLocaleString() : "No active session"}</div>
          </div>
          <Button onClick={toggleClock}>{clockedIn ? "Clock Out" : "Clock In"}</Button>
        </div>
      </Card>
    </div>
  );
}
