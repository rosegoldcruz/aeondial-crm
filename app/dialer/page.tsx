"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { CreateOrganization, OrganizationList, SignedIn, useAuth } from "@clerk/nextjs";
import { AlertCircle, CheckCircle2, FileText, Loader2, Pause, Phone, PhoneOff, Play, RadioTower, Square, SkipForward } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type JsonRecord = Record<string, unknown>;

interface RawRouteResponse {
  ok: boolean;
  status: number;
  text: string;
  json: unknown;
}

interface DialerContract {
  checked_at: string;
  identity: {
    userId: string | null;
    orgId: string | null;
    email: string | null;
    displayName: string | null;
  };
  backend_user_mapping: {
    exact_user_org_row: JsonRecord | null;
    email_org_row: JsonRecord | null;
    has_exact_user_org_row: boolean;
    endpoint_metadata: JsonRecord | null;
  };
  raw_campaigns_response: RawRouteResponse;
  raw_softphone_response: RawRouteResponse;
  registration: {
    endpoint: string | null;
    status: string | null;
    source: string | null;
    reason: string | null;
  };
  campaign_access: {
    org_has_campaigns: boolean;
    org_campaign_count: number;
    org_campaigns: JsonRecord[];
    user_allowed_to_see_campaigns: boolean;
    rendered_campaign_count: number;
  };
  diagnosis: {
    unauthorized: boolean;
    unauthorized_reasons: string[];
    browser_softphone_reason: string;
    active_org_required: boolean;
    suggested_next_step: string;
  };
}

interface CampaignOption {
  campaign_id: string;
  label: string;
}

interface CampaignStatus {
  queue: { waiting: number; active: number; failed: number; completed: number };
  agents: { ready: number; incall: number };
  leads: { pending: number };
  live_calls_data: Array<{ call_id: string; contact_id?: string; lead_id?: string; status?: string; metadata?: JsonRecord }>;
}

const DISPOSITION_OPTIONS = [
  { value: "interested", label: "Interested", color: "bg-green-600" },
  { value: "qualified", label: "Qualified", color: "bg-green-700" },
  { value: "appointment_set", label: "Appointment", color: "bg-green-800" },
  { value: "sale", label: "Sale", color: "bg-emerald-600" },
  { value: "callback_requested", label: "Callback", color: "bg-blue-600" },
  { value: "no_answer", label: "No Answer", color: "bg-yellow-600" },
  { value: "voicemail", label: "Voicemail", color: "bg-yellow-700" },
  { value: "busy", label: "Busy", color: "bg-orange-600" },
  { value: "not_interested", label: "Not Interested", color: "bg-gray-600" },
  { value: "wrong_number", label: "Wrong Number", color: "bg-red-600" },
  { value: "bad_number", label: "Bad Number", color: "bg-red-700" },
  { value: "do_not_call", label: "DNC", color: "bg-red-800" },
] as const;

function extractCampaigns(raw: unknown): JsonRecord[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object");
  }
  if (raw && typeof raw === "object") {
    const record = raw as { campaigns?: unknown[]; data?: unknown[]; items?: unknown[]; results?: unknown[] };
    if (Array.isArray(record.campaigns)) return extractCampaigns(record.campaigns);
    if (Array.isArray(record.data)) return extractCampaigns(record.data);
    if (Array.isArray(record.items)) return extractCampaigns(record.items);
    if (Array.isArray(record.results)) return extractCampaigns(record.results);
  }
  return [];
}

function formatJson(value: unknown): string {
  if (value == null) return "null";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function DialerPage() {
  const { orgId: clientOrgId } = useAuth();
  const [contract, setContract] = useState<DialerContract | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Step 1: Arm agent session
  const [readyPending, setReadyPending] = useState(false);
  const [sessionArmed, setSessionArmed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);

  // Step 2: Start campaign dialer
  const [campaignStartPending, setCampaignStartPending] = useState(false);
  const [dialerRunning, setDialerRunning] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Campaign status polling
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | null>(null);

  // Disposition
  const [lastCallId, setLastCallId] = useState<string | null>(null);
  const [lastCallAttemptId, setLastCallAttemptId] = useState<string | null>(null);
  const [dispositionPending, setDispositionPending] = useState(false);
  const [dispositionDone, setDispositionDone] = useState(false);
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [callbackAt, setCallbackAt] = useState("");

  // Load contract
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setLoadError(null);
      try {
        const response = await fetch("/api/dialer/contract", { method: "GET", cache: "no-store" });
        const body = (await response.json()) as DialerContract;
        if (!response.ok) throw new Error(formatJson(body));
        if (!cancelled) {
          setContract(body);
          const campaigns = extractCampaigns(body.raw_campaigns_response.json);
          if (campaigns.length === 1) {
            const id = campaigns[0]?.campaign_id;
            if (typeof id === "string") setSelectedCampaign(id);
          }
        }
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "Failed to load dialer contract");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [clientOrgId]);

  const softphonePayload =
    contract?.raw_softphone_response.json && typeof contract.raw_softphone_response.json === "object"
      ? (contract.raw_softphone_response.json as JsonRecord)
      : null;

  const campaignOptions = useMemo<CampaignOption[]>(() => {
    const campaigns = extractCampaigns(contract?.raw_campaigns_response.json);
    return campaigns
      .map((c) => {
        const id = c.campaign_id;
        if (typeof id !== "string" || !id.trim()) return null;
        const name = typeof c.name === "string" && c.name.trim() ? c.name.trim() : id;
        return { campaign_id: id, label: name };
      })
      .filter((c): c is CampaignOption => Boolean(c));
  }, [contract]);

  const agentId =
    typeof softphonePayload?.agent_id === "string"
      ? softphonePayload.agent_id
      : contract?.identity.userId || "";

  const readyEnabled =
    Boolean(selectedCampaign) &&
    Boolean(contract?.registration.endpoint) &&
    contract?.registration.status === "registered" &&
    contract?.registration.source === "ari";

  // Poll campaign status while dialer is running
  useEffect(() => {
    if (!dialerRunning || !selectedCampaign) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/status`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setCampaignStatus(data);
          // Surface live call for disposition
          if (data.live_calls_data && Array.isArray(data.live_calls_data) && data.live_calls_data.length > 0) {
            const latest = data.live_calls_data[data.live_calls_data.length - 1];
            if (typeof latest.call_id === "string" && latest.call_id !== lastCallId) {
              setLastCallId(latest.call_id);
              const meta = latest.metadata as JsonRecord | undefined;
              const attemptId = typeof meta?.call_attempt_id === "string" ? meta.call_attempt_id : null;
              setLastCallAttemptId(attemptId);
              setDispositionDone(false);
              setDispositionNotes("");
              setCallbackAt("");
            }
          }
        }
      } catch {
        // Polling failure is non-fatal
      }
    }
    void poll();
    const interval = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dialerRunning, selectedCampaign, lastCallId]);

  // Step 1: Arm agent session
  const goReady = useCallback(async () => {
    if (!contract || !readyEnabled) return;
    setReadyPending(true);
    setReadyError(null);
    try {
      const response = await fetch("/api/dialer/agents/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          campaign_id: selectedCampaign,
          endpoint: contract.registration.endpoint,
          softphone: softphonePayload,
        }),
      });
      const text = await response.text();
      if (!response.ok) {
        setReadyError(`Session failed (${response.status}): ${text}`);
        return;
      }
      setSessionArmed(true);
      try {
        const parsed = JSON.parse(text);
        if (parsed.session?.session_id) setSessionId(parsed.session.session_id);
        else if (parsed.session_id) setSessionId(parsed.session_id);
      } catch {
        // Non-JSON response is fine, session is armed
      }
    } catch (error) {
      setReadyError(error instanceof Error ? error.message : "READY request failed");
    } finally {
      setReadyPending(false);
    }
  }, [contract, readyEnabled, agentId, selectedCampaign, softphonePayload]);

  // Step 2: Start campaign
  const startCampaign = useCallback(async () => {
    if (!selectedCampaign || !sessionArmed) return;
    setCampaignStartPending(true);
    setStartError(null);
    try {
      const response = await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const text = await response.text();
      if (!response.ok) {
        setStartError(`Start failed (${response.status}): ${text}`);
        return;
      }
      setDialerRunning(true);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Campaign start failed");
    } finally {
      setCampaignStartPending(false);
    }
  }, [selectedCampaign, sessionArmed]);

  // Stop campaign
  const stopCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    try {
      await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/stop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      setDialerRunning(false);
      setCampaignStatus(null);
    } catch {
      // fail silently, user can retry
    }
  }, [selectedCampaign]);

  // Pause/Resume agent
  const togglePause = useCallback(async () => {
    if (!sessionId) return;
    const currentlyReady = campaignStatus?.agents?.ready ?? 0;
    const targetState = currentlyReady > 0 ? "PAUSED" : "READY";
    try {
      await fetch(`/api/dialer/agents/${encodeURIComponent(sessionId)}/state`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ state: targetState }),
      });
    } catch {
      // fail silently
    }
  }, [sessionId, campaignStatus]);

  // Submit disposition (wrap-up)
  const submitDisposition = useCallback(async (outcome: string) => {
    if (dispositionPending) return;
    // Prefer call_attempt_id for new wrap-up endpoint, fall back to legacy
    const attemptId = lastCallAttemptId;
    if (!attemptId && !lastCallId) return;
    setDispositionPending(true);
    try {
      if (attemptId) {
        await fetch(`/api/dialer/call-attempts/${encodeURIComponent(attemptId)}/wrap-up`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_disposition: outcome,
            notes: dispositionNotes || undefined,
            callback_at: outcome === "callback_requested" && callbackAt ? callbackAt : undefined,
          }),
        });
      } else {
        // Legacy fallback for calls without an attempt row
        await fetch(`/api/dialer/calls/${encodeURIComponent(lastCallId!)}/disposition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            outcome,
            notes: dispositionNotes || undefined,
            session_id: sessionId || undefined,
          }),
        });
      }
      setDispositionDone(true);
    } catch {
      // fail silently
    } finally {
      setDispositionPending(false);
    }
  }, [lastCallId, lastCallAttemptId, dispositionPending, dispositionNotes, callbackAt, sessionId]);

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold">AEON Dialer</h1>
              <p className="text-sm text-gray-400">ARI outbound campaign dialer</p>
            </div>
          </div>
          {dialerRunning ? (
            <Badge className="bg-green-900 text-green-200">Dialer Running</Badge>
          ) : sessionArmed ? (
            <Badge className="bg-yellow-900 text-yellow-200">Session Armed</Badge>
          ) : (
            <Badge className="bg-gray-800 text-gray-300">Idle</Badge>
          )}
        </div>

        {/* Loading / Error */}
        {loading && (
          <Card className="border-gray-700 bg-gray-900">
            <CardContent className="flex items-center gap-2 py-6 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading dialer contract…
            </CardContent>
          </Card>
        )}
        {loadError && (
          <Card className="border-red-800 bg-red-950/40">
            <CardContent className="flex items-center gap-2 py-4 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" /> {loadError}
            </CardContent>
          </Card>
        )}

        {contract ? (
          <>
            {/* Active Org Required */}
            {contract.diagnosis.active_org_required && (
              <Card className="border-amber-800 bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="text-base text-amber-100">Active Org Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-amber-50">
                  <p>Clerk has a signed-in user but no active org. The dialer requires both userId and orgId.</p>
                  <SignedIn>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 text-xs uppercase tracking-wide text-amber-300">Select existing org</div>
                        <OrganizationList
                          afterSelectOrganizationUrl={(org) => `/org-sync?redirect_url=%2Fdialer&selected_org_id=${encodeURIComponent(org.id)}`}
                          afterCreateOrganizationUrl="/org-sync?redirect_url=%2Fdialer"
                          hidePersonal
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 text-xs uppercase tracking-wide text-amber-300">Or create org</div>
                        <CreateOrganization afterCreateOrganizationUrl="/org-sync?redirect_url=%2Fdialer" />
                      </div>
                    </div>
                  </SignedIn>
                </CardContent>
              </Card>
            )}

            {/* Main 2-column: Controls + Status */}
            <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
              {/* Left: Controls */}
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Dialer Controls</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Identity summary */}
                  <div className="grid gap-1 text-sm">
                    <div><span className="text-gray-400">agent:</span> {contract.identity.displayName || contract.identity.email || contract.identity.userId || "—"}</div>
                    <div><span className="text-gray-400">endpoint:</span> {contract.registration.endpoint || "none"}</div>
                    <div>
                      <span className="text-gray-400">registration:</span>{" "}
                      <span className={contract.registration.status === "registered" && contract.registration.source === "ari" ? "text-green-400" : "text-red-400"}>
                        {contract.registration.status || "—"} ({contract.registration.source || "—"})
                      </span>
                    </div>
                  </div>

                  {/* Campaign selector */}
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300" htmlFor="campaign">Campaign</label>
                    <select
                      id="campaign"
                      value={selectedCampaign}
                      onChange={(e) => setSelectedCampaign(e.target.value)}
                      disabled={dialerRunning}
                      className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                    >
                      <option value="">Choose a campaign</option>
                      {campaignOptions.map((c) => (
                        <option key={c.campaign_id} value={c.campaign_id}>{c.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Step 1: Arm */}
                  <Button
                    onClick={goReady}
                    disabled={!readyEnabled || readyPending || sessionArmed}
                    className="h-11 w-full bg-green-600 font-semibold text-white hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-300"
                  >
                    {readyPending ? "Arming…" : sessionArmed ? "✓ Session Armed" : "1. Arm Agent Session"}
                  </Button>
                  {readyError && (
                    <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
                      <AlertCircle className="mr-1 inline h-4 w-4" /> {readyError}
                    </div>
                  )}

                  {/* Step 2: Start */}
                  <Button
                    onClick={startCampaign}
                    disabled={!sessionArmed || campaignStartPending || dialerRunning}
                    className="h-11 w-full bg-blue-600 font-semibold text-white hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-300"
                  >
                    {campaignStartPending ? "Starting…" : dialerRunning ? "✓ Dialer Running" : "2. Start Campaign Dialer"}
                  </Button>
                  {startError && (
                    <div className="rounded-md border border-red-800 bg-red-950/40 p-3 text-sm text-red-200">
                      <AlertCircle className="mr-1 inline h-4 w-4" /> {startError}
                    </div>
                  )}

                  {/* Operator controls — only when dialer is running */}
                  {dialerRunning && (
                    <div className="flex gap-2 pt-2">
                      <Button onClick={togglePause} variant="outline" className="flex-1 border-yellow-700 text-yellow-300 hover:bg-yellow-900/30">
                        {(campaignStatus?.agents?.ready ?? 0) > 0 ? (
                          <><Pause className="mr-1 h-4 w-4" /> Pause</>
                        ) : (
                          <><Play className="mr-1 h-4 w-4" /> Resume</>
                        )}
                      </Button>
                      <Button onClick={stopCampaign} variant="outline" className="flex-1 border-red-700 text-red-300 hover:bg-red-900/30">
                        <Square className="mr-1 h-4 w-4" /> Stop Campaign
                      </Button>
                    </div>
                  )}

                  <p className="text-xs text-gray-500">
                    Step 1 arms the agent session (READY). Step 2 starts the BullMQ engine which picks up queued leads, originates via ARI, and bridges to {contract.registration.endpoint || "—"}.
                  </p>
                </CardContent>
              </Card>

              {/* Right: Campaign status */}
              <div className="flex flex-col gap-4">
                <Card className="border-gray-700 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="text-base text-gray-100">Campaign Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3 text-sm">
                    {!dialerRunning ? (
                      <p className="text-gray-500">Start the dialer to see live status.</p>
                    ) : !campaignStatus ? (
                      <div className="flex items-center gap-2 text-gray-400"><Loader2 className="h-4 w-4 animate-spin" /> Polling…</div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-md bg-gray-800 p-2 text-center">
                            <div className="text-xl font-bold text-blue-400">{campaignStatus.queue.waiting}</div>
                            <div className="text-xs text-gray-400">Queued</div>
                          </div>
                          <div className="rounded-md bg-gray-800 p-2 text-center">
                            <div className="text-xl font-bold text-yellow-400">{campaignStatus.queue.active}</div>
                            <div className="text-xs text-gray-400">Active</div>
                          </div>
                          <div className="rounded-md bg-gray-800 p-2 text-center">
                            <div className="text-xl font-bold text-green-400">{campaignStatus.queue.completed}</div>
                            <div className="text-xs text-gray-400">Completed</div>
                          </div>
                          <div className="rounded-md bg-gray-800 p-2 text-center">
                            <div className="text-xl font-bold text-red-400">{campaignStatus.queue.failed}</div>
                            <div className="text-xs text-gray-400">Failed</div>
                          </div>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-gray-400">Agents ready: <span className="text-green-400">{campaignStatus.agents.ready}</span></span>
                          <span className="text-gray-400">In call: <span className="text-yellow-400">{campaignStatus.agents.incall}</span></span>
                          <span className="text-gray-400">Live: <span className="text-blue-400">{campaignStatus.live_calls_data?.length ?? 0}</span></span>
                          <span className="text-gray-400">Pending: <span className="text-purple-400">{campaignStatus.leads?.pending ?? 0}</span></span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Call Notes */}
                <Card className="border-gray-700 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <FileText className="h-4 w-4" /> Call Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dialerRunning ? (
                      <textarea
                        placeholder="Type notes here — they'll be included with the next disposition…"
                        value={dispositionNotes}
                        onChange={(e) => setDispositionNotes(e.target.value)}
                        rows={5}
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Start the dialer to take notes.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Disposition panel */}
                <Card className="border-gray-700 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <Phone className="h-4 w-4" /> Call Disposition
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {!lastCallId ? (
                      <p className="text-sm text-gray-500">No active call to disposition.</p>
                    ) : dispositionDone ? (
                      <div className="flex items-center gap-2 rounded-md border border-green-800 bg-green-950/40 p-3 text-sm text-green-200">
                        <CheckCircle2 className="h-4 w-4" /> Disposition submitted
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-gray-400">Call: {lastCallId.slice(0, 12)}…{lastCallAttemptId ? ` | Attempt: ${lastCallAttemptId.slice(0, 8)}…` : ""}</div>
                        <div className="grid grid-cols-3 gap-2">
                          {DISPOSITION_OPTIONS.map((d) => (
                            <Button
                              key={d.value}
                              onClick={() => submitDisposition(d.value)}
                              disabled={dispositionPending}
                              className={`${d.color} h-9 text-xs font-medium text-white hover:opacity-80 disabled:opacity-50`}
                            >
                              {d.label}
                            </Button>
                          ))}
                        </div>
                        {/* Callback datetime picker */}
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-400" htmlFor="callback-at">Callback date/time (for Callback disposition)</label>
                          <input
                            id="callback-at"
                            type="datetime-local"
                            value={callbackAt}
                            onChange={(e) => setCallbackAt(e.target.value)}
                            className="h-9 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-blue-500"
                          />
                        </div>
                        <p className="text-xs text-gray-500">Notes from above will be included with the disposition.</p>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
