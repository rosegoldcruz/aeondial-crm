"use client";

import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ORG_ID, apiGet } from "@/lib/backend";

type ContactRecord = {
  contact_id: string;
  metadata?: {
    first_name?: string;
    last_name?: string;
    email?: string;
    phone?: string;
    [key: string]: unknown;
  };
};

type CallRecord = {
  call_id: string;
  contact_id: string;
  status: string;
  created_at?: string;
  metadata?: {
    disposition?: string;
    notes?: string;
    [key: string]: unknown;
  };
};

export default function AppointmentsPage() {
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [contactData, callData] = await Promise.all([
          apiGet<ContactRecord[]>(`/contacts?org_id=${encodeURIComponent(ORG_ID)}&limit=300`),
          apiGet<CallRecord[]>(`/telephony/calls?org_id=${encodeURIComponent(ORG_ID)}&limit=300`),
        ]);
        if (!mounted) return;
        setContacts(contactData);
        setCalls(callData);
      } catch (e) {
        if (!mounted) return;
        setError(e instanceof Error ? e.message : "Failed to load appointment queue");
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const followUps = useMemo(() => {
    const contactMap = new Map(contacts.map((c) => [c.contact_id, c]));

    return calls
      .filter((call) => call.status === "completed" || call.status === "transferred")
      .slice(0, 100)
      .map((call) => {
        const contact = contactMap.get(call.contact_id);
        const fullName = `${contact?.metadata?.first_name || "Unknown"} ${contact?.metadata?.last_name || "Contact"}`;
        return {
          callId: call.call_id,
          contactId: call.contact_id,
          name: fullName,
          email: contact?.metadata?.email || "No email",
          phone: contact?.metadata?.phone || "No phone",
          notes: call.metadata?.notes || "No notes",
          disposition: call.metadata?.disposition || "follow_up",
          at: call.created_at || "",
        };
      });
  }, [calls, contacts]);

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Appointments</h1>
        <p className="text-sm text-neutral-500">Live follow-up queue generated from contact and call outcomes.</p>
      </div>

      {error ? <Card className="border-red-300 p-4 text-sm text-red-700">{error}</Card> : null}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Calendar className="h-4 w-4" /> Follow-ups</div>
          <div className="mt-2 text-2xl font-semibold">{followUps.length}</div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-sm text-neutral-500"><Clock className="h-4 w-4" /> Contacts</div>
          <div className="mt-2 text-2xl font-semibold">{contacts.length}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-neutral-500">Completed Calls Considered</div>
          <div className="mt-2 text-2xl font-semibold">{calls.filter((c) => c.status === "completed").length}</div>
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="mb-3 text-lg font-medium">Upcoming Follow-ups</h2>
        <div className="space-y-2">
          {followUps.map((item) => (
            <div key={item.callId} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <div>
                <div className="font-medium">{item.name}</div>
                <div className="text-neutral-500">{item.email} • {item.phone}</div>
                <div className="text-neutral-500">{item.notes}</div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{item.contactId}</Badge>
                <Badge>{item.disposition}</Badge>
              </div>
            </div>
          ))}
          {followUps.length === 0 ? <div className="text-sm text-neutral-500">No follow-up appointments yet.</div> : null}
        </div>
      </Card>
    </div>
  );
}
