"use client";

import { useEffect, useState } from "react";
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

export default function TeamSettingsPage() {
  const [users, setUsers] = useState<UserRecord[]>([]);

  useEffect(() => {
    let mounted = true;
    apiGet<UserRecord[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`)
      .then((data) => {
        if (!mounted) return;
        setUsers(data);
      })
      .catch(() => {
        if (!mounted) return;
        setUsers([]);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-semibold">Team Settings</h1>
      <Card className="p-4">
        <div className="space-y-2">
          {users.map((user) => (
            <div key={user.user_id} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{user.full_name || user.email}</div>
                <div className="text-neutral-500">{user.email}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{user.role}</Badge>
                <Badge>{user.status}</Badge>
              </div>
            </div>
          ))}
          {users.length === 0 ? <div className="text-sm text-neutral-500">No team members found.</div> : null}
        </div>
      </Card>
    </div>
  );
}
