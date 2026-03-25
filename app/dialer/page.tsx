"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { CreateOrganization, OrganizationList, SignedIn, useAuth } from "@clerk/nextjs";
import {
  AlertCircle, CheckCircle2, Clock, FileText, Loader2, Pause, Phone,
  PhoneOff, Play, RadioTower, Square, User, Zap,
} from "lucide-react";
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

interface ActiveCallData {
  has_active_call: boolean;
  agent_user_id: string;
  session_id: string | null;
  campaign: { id: string; name: string | null } | null;
  lead: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    status: string | null;
    latest_note: string | null;
    last_agent_disposition: string | null;
    callback_at: string | null;
    do_not_call: boolean;
    attempt_count: number;
  } | null;
  call_attempt: {
    id: string;
    call_id: string;
    state: string;
    system_outcome: string | null;
    agent_disposition: string | null;
    started_at: string | null;
    answered_at: string | null;
    bridged_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    talk_seconds: number | null;
  } | null;
  queue: {
    dial_state: string | null;
    attempt_count: number;
    max_attempts: number;
    next_retry_at: string | null;
    is_callable: boolean;
    callback_at: string | null;
  } | null;
}

interface WrapUpData {
  has_wrap_up: boolean;
  session_id?: string | null;
  campaign?: { id: string; name: string | null } | null;
  lead?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    phone: string | null;
    status: string | null;
    latest_note: string | null;
    last_agent_disposition: string | null;
    do_not_call: boolean;
    attempt_count: number;
  } | null;
  call_attempt?: {
    id: string;
    call_id: string;
    system_outcome: string | null;
    agent_disposition: string | null;
    wrap_up_status: string | null;
    started_at: string | null;
    answered_at: string | null;
    bridged_at: string | null;
    ended_at: string | null;
    duration_seconds: number | null;
    talk_seconds: number | null;
  } | null;
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

const STATE_COLORS: Record<string, string> = {
  queued: "bg-gray-600",
  dialing: "bg-blue-600 animate-pulse",
  ringing: "bg-blue-500 animate-pulse",
  answered: "bg-yellow-600",
  bridged: "bg-green-600 animate-pulse",
  completed: "bg-gray-500",
  failed: "bg-red-600",
  no_answer: "bg-yellow-700",
  originated: "bg-blue-600 animate-pulse",
};

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
  try { return JSON.stringify(value, null, 2); } catch { return String(value); }
}

function formatDuration(seconds: number | null | undefined): string {
  if (seconds == null || seconds < 0) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  } catch { return iso; }
}

function LiveTimer({ startIso }: { startIso: string | null | undefined }) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!startIso) { setElapsed(0); return; }
    const start = new Date(startIso).getTime();
    const tick = () => setElapsed(Math.max(0, Math.floor((Date.now() - start) / 1000)));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startIso]);
  if (!startIso) return <span className="text-gray-500">—</span>;
  return <span className="font-mono tabular-nums">{formatDuration(elapsed)}</span>;
}

export default function DialerPage() {
  const { orgId: clientOrgId } = useAuth();
  const [contract, setContract] = useState<DialerContract | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Session + dialer
  const [readyPending, setReadyPending] = useState(false);
  const [sessionArmed, setSessionArmed] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [readyError, setReadyError] = useState<string | null>(null);
  const [agentLegLive, setAgentLegLive] = useState(false);      // registration_verified=true AND channel_id set
  const [agentReadyForDial, setAgentReadyForDial] = useState(false); // go-ready confirmed
  const [campaignStartPending, setCampaignStartPending] = useState(false);
  const [dialerRunning, setDialerRunning] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  // Campaign status
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | null>(null);

  // Active call context (the main thing)
  const [activeCall, setActiveCall] = useState<ActiveCallData | null>(null);

  // Wrap-up context (ended call needing disposition)
  const [wrapUp, setWrapUp] = useState<WrapUpData | null>(null);

  // Hangup
  const [hangupPending, setHangupPending] = useState(false);

  // Disposition state
  const [dispositionPending, setDispositionPending] = useState(false);
  const [dispositionDone, setDispositionDone] = useState(false);
  const [dispositionNotes, setDispositionNotes] = useState("");
  const [callbackAt, setCallbackAt] = useState("");
  const lastDisposedAttemptId = useRef<string | null>(null);

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
          console.log("Dialer Contract:", body);
          setContract(body);
          const campaigns = extractCampaigns(body.raw_campaigns_response.json);
          if (campaigns.length === 1) {
            const id = campaigns[0]?.campaign_id;
            if (typeof id === "string") setSelectedCampaign(id);
          }
        }
      } catch (error) {
        console.error("Failed to load dialer contract:", error);
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
      ? (contract.raw_softphone_response.json as JsonRecord) : null;

  const campaignOptions = useMemo<CampaignOption[]>(() => {
    // Prefer direct Supabase org_campaigns (bypasses backend user-mapping issues)
    const directCampaigns = contract?.campaign_access.org_campaigns ?? [];
    const raw = directCampaigns.length > 0
      ? directCampaigns
      : extractCampaigns(contract?.raw_campaigns_response.json);
    return raw.map((c) => {
      const id = c.campaign_id;
      if (typeof id !== "string" || !id.trim()) return null;
      const name = typeof c.name === "string" && c.name.trim() ? c.name.trim() : id;
      return { campaign_id: id, label: name };
    }).filter((c): c is CampaignOption => Boolean(c));
  }, [contract]);

  const agentId =
    typeof softphonePayload?.agent_id === "string" ? softphonePayload.agent_id
      : contract?.identity.userId || "";

  // ARM is enabled only when a campaign is selected, endpoint is set, and SIP is confirmed registered.
  const hasEndpoint = Boolean(contract?.registration.endpoint);
  const readyEnabled =
    Boolean(selectedCampaign) &&
    hasEndpoint &&
    ariConfirmed &&
    !contract?.diagnosis.unauthorized &&
    (Boolean(contract?.backend_user_mapping.has_exact_user_org_row) ||
      Boolean(contract?.backend_user_mapping.email_org_row));
  const ariConfirmed =
    contract?.registration.status === "registered" &&
    contract?.registration.source === "ari";

  // ── Polling: agent leg status (every 2s while armed but leg not yet live) ──
  useEffect(() => {
    if (!sessionArmed || agentLegLive || !agentId) return;
    let cancelled = false;
    async function pollLeg() {
      try {
        const res = await fetch(`/api/dialer/agents/${encodeURIComponent(agentId)}/session`);
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as { session?: { registration_verified?: boolean; channel_id?: string } };
        if (data?.session?.registration_verified && data?.session?.channel_id) {
          if (!cancelled) setAgentLegLive(true);
        }
      } catch { /* non-fatal */ }
    }
    void pollLeg();
    const interval = setInterval(pollLeg, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [sessionArmed, agentLegLive, agentId]);

  // ── Polling: campaign status (every 3s) ──
  useEffect(() => {
    if (!dialerRunning || !selectedCampaign) return;
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/status`);
        if (res.ok && !cancelled) setCampaignStatus(await res.json());
      } catch { /* non-fatal */ }
    }
    void poll();
    const interval = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dialerRunning, selectedCampaign]);

  // ── Polling: active-call + wrap-up context (every 2s while dialer running or has state) ──
  useEffect(() => {
    if (!dialerRunning && !activeCall?.has_active_call && !wrapUp?.has_wrap_up) return;
    let cancelled = false;
    async function poll() {
      try {
        const [acRes, wuRes] = await Promise.all([
          fetch("/api/dialer/agents/self/active-call"),
          fetch("/api/dialer/agents/self/wrap-up"),
        ]);
        if (cancelled) return;
        if (acRes.ok) {
          const data = (await acRes.json()) as ActiveCallData;
          setActiveCall(data);
          // New active call → reset disposition state
          if (data.has_active_call && data.call_attempt?.id && data.call_attempt.id !== lastDisposedAttemptId.current) {
            setDispositionDone(false);
            setDispositionNotes("");
            setCallbackAt("");
          }
        }
        if (wuRes.ok) {
          const data = (await wuRes.json()) as WrapUpData;
          setWrapUp(data);
          // If disposition was already submitted for this attempt, mark done
          if (data.has_wrap_up && data.call_attempt?.id === lastDisposedAttemptId.current) {
            // Already disposed — wrap-up will clear on next poll when wrap_up_status != pending
          }
        }
      } catch (error) {
        console.error("Polling for active call/wrap-up failed:", error);
      }
    }
    void poll();
    const interval = setInterval(poll, 2000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [dialerRunning, activeCall?.has_active_call, wrapUp?.has_wrap_up]);

  // Arm Agent Session (SIP already confirmed registered by readyEnabled gate)
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
      if (!response.ok) { setReadyError(`Session failed (${response.status}): ${text}`); return; }
      setSessionArmed(true);
      setAgentLegLive(false);
      setAgentReadyForDial(false);
      try {
        const parsed = JSON.parse(text);
        if (parsed.session?.session_id) setSessionId(parsed.session.session_id);
        else if (parsed.session_id) setSessionId(parsed.session_id);
      } catch { /* ok */ }
    } catch (error) {
      setReadyError(error instanceof Error ? error.message : "READY request failed");
    } finally { setReadyPending(false); }
  }, [contract, readyEnabled, agentId, selectedCampaign, softphonePayload]);

  // Confirm agent leg is live → transition OFFLINE to READY
  const goReadyAfterLeg = useCallback(async () => {
    if (!sessionId || !agentLegLive || readyPending) return;
    setReadyPending(true);
    setReadyError(null);
    try {
      const response = await fetch(`/api/dialer/agents/${encodeURIComponent(sessionId)}/go-ready`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const text = await response.text();
      if (!response.ok) { setReadyError(`Go-ready failed (${response.status}): ${text}`); return; }
      setAgentReadyForDial(true);
    } catch (error) {
      setReadyError(error instanceof Error ? error.message : "Go-ready request failed");
    } finally { setReadyPending(false); }
  }, [sessionId, agentLegLive, readyPending]);

  // Start campaign
  const startCampaign = useCallback(async () => {
    if (!selectedCampaign || !agentReadyForDial) return;
    setCampaignStartPending(true);
    setStartError(null);
    try {
      const response = await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/start`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      const text = await response.text();
      if (!response.ok) { setStartError(`Start failed (${response.status}): ${text}`); return; }
      setDialerRunning(true);
    } catch (error) {
      setStartError(error instanceof Error ? error.message : "Campaign start failed");
    } finally { setCampaignStartPending(false); }
  }, [selectedCampaign, agentReadyForDial]);

  // Stop campaign
  const stopCampaign = useCallback(async () => {
    if (!selectedCampaign) return;
    try {
      await fetch(`/api/dialer/campaigns/${encodeURIComponent(selectedCampaign)}/stop`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: "{}",
      });
      setDialerRunning(false);
      setCampaignStatus(null);
    } catch { /* ok */ }
  }, [selectedCampaign]);

  // Pause/Resume
  const togglePause = useCallback(async () => {
    if (!sessionId) return;
    const targetState = (campaignStatus?.agents?.ready ?? 0) > 0 ? "PAUSED" : "READY";
    try {
      await fetch(`/api/dialer/agents/${encodeURIComponent(sessionId)}/state`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ state: targetState }),
      });
    } catch { /* ok */ }
  }, [sessionId, campaignStatus]);

  // Hangup active call
  const doHangup = useCallback(async () => {
    if (hangupPending) return;
    setHangupPending(true);
    try {
      await fetch("/api/dialer/agents/self/hangup", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
    } catch { /* ok */ }
    finally { setHangupPending(false); }
  }, [hangupPending]);

  // Submit disposition using wrap-up context (or active call fallback)
  const submitDisposition = useCallback(async (outcome: string) => {
    if (dispositionPending) return;
    // Prefer wrap-up attempt ID, fall back to active call attempt ID
    const attemptId = wrapUp?.call_attempt?.id || activeCall?.call_attempt?.id;
    const wrapSessionId = wrapUp?.session_id || activeCall?.session_id || sessionId;
    if (!attemptId) return;
    setDispositionPending(true);
    try {
      const res = await fetch(`/api/dialer/call-attempts/${encodeURIComponent(attemptId)}/wrap-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          disposition: outcome,
          notes: dispositionNotes || undefined,
          callback_at: outcome === "callback_requested" && callbackAt ? callbackAt : undefined,
          session_id: wrapSessionId || undefined,
        }),
      });
      if (res.ok) {
        setDispositionDone(true);
        lastDisposedAttemptId.current = attemptId;
        setWrapUp(null);
      }
    } catch { /* ok */ }
    finally { setDispositionPending(false); }
  }, [wrapUp, activeCall, dispositionPending, dispositionNotes, callbackAt, sessionId]);

  // Derived 3-state machine
  const isLiveCall = Boolean(activeCall?.has_active_call);
  const isWrapUp = Boolean(!isLiveCall && wrapUp?.has_wrap_up && !dispositionDone);
  const isIdle = !isLiveCall && !isWrapUp;

  // Current context for display
  const ac = isLiveCall ? activeCall : null;
  const wu = isWrapUp ? wrapUp : null;
  const lead = ac?.lead || wu?.lead || null;
  const attempt = ac?.call_attempt || wu?.call_attempt || null;
  const campaign = ac?.campaign || wu?.campaign || null;

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold">AEON Dialer</h1>
              <p className="text-sm text-gray-400">Agent Console</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isLiveCall && attempt && (
              <Badge className={`${STATE_COLORS[(attempt as ActiveCallData["call_attempt"])?.state ?? ""] || "bg-gray-600"} text-white`}>
                {((attempt as ActiveCallData["call_attempt"])?.state ?? "").toUpperCase()}
              </Badge>
            )}
            {isWrapUp && (
              <Badge className="bg-yellow-700 text-yellow-100 animate-pulse">WRAP-UP</Badge>
            )}
            {dialerRunning ? (
              <Badge className="bg-green-900 text-green-200">Dialer Running</Badge>
            ) : sessionArmed ? (
              <Badge className="bg-yellow-900 text-yellow-200">Session Armed</Badge>
            ) : (
              <Badge className="bg-gray-800 text-gray-300">Idle</Badge>
            )}
          </div>
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
            {/* Debug View */}
            <details className="mt-2 rounded-md border border-gray-700 bg-gray-900/50">
              <summary className="cursor-pointer px-3 py-2 text-xs text-gray-400">
                Debug View: Dialer Contract
              </summary>
              <pre className="overflow-x-auto p-3 text-[10px] leading-tight">
                {formatJson(contract)}
              </pre>
            </details>

            {/* Active Org Required */}
            {contract.diagnosis.active_org_required && (
              <Card className="border-amber-800 bg-amber-950/30">
                <CardHeader><CardTitle className="text-base text-amber-100">Active Org Required</CardTitle></CardHeader>
                <CardContent className="space-y-4 text-sm text-amber-50">
                  <p>Clerk has a signed-in user but no active org.</p>
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

            {/* ═══ STATE 1: LIVE CALL ═══ */}
            {isLiveCall && lead && attempt && (
              <div className="grid gap-4 lg:grid-cols-2">
                {/* Active Lead */}
                <Card className="border-l-4 border-l-green-500 border-green-900/50 bg-gray-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <User className="h-4 w-4" /> Active Lead
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-semibold text-white">
                        {[lead.first_name, lead.last_name].filter(Boolean).join(" ") || "Unknown"}
                      </span>
                      {lead.do_not_call && <Badge className="bg-red-800 text-xs">DNC</Badge>}
                    </div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-gray-400">Phone:</span> <span className="text-white font-mono">{lead.phone || "—"}</span></div>
                      <div><span className="text-gray-400">Lead ID:</span> <span className="text-gray-300">{lead.id?.slice(0, 20) || "—"}</span></div>
                      <div><span className="text-gray-400">Campaign:</span> <span className="text-gray-300">{campaign?.name || campaign?.id || "—"}</span></div>
                      <div><span className="text-gray-400">Status:</span> <span className="text-gray-300">{lead.status || "—"}</span></div>
                      <div><span className="text-gray-400">Attempts:</span> <span className="text-gray-300">{lead.attempt_count ?? 0}{ac?.queue ? ` / ${ac.queue.max_attempts}` : ""}</span></div>
                      <div><span className="text-gray-400">Last Dispo:</span> <span className="text-gray-300">{lead.last_agent_disposition || "—"}</span></div>
                    </div>
                    {lead.latest_note && (
                      <div className="mt-1 rounded bg-gray-800 p-2 text-xs text-gray-300">
                        <span className="text-gray-500">Note:</span> {lead.latest_note}
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Active Call + Hangup */}
                <Card className="border-l-4 border-l-blue-500 border-blue-900/50 bg-gray-900">
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <Phone className="h-4 w-4" /> Active Call
                      <Badge className={`ml-auto ${STATE_COLORS[(attempt as ActiveCallData["call_attempt"])?.state ?? ""] || "bg-gray-600"} text-xs text-white`}>
                        {((attempt as ActiveCallData["call_attempt"])?.state ?? "").toUpperCase()}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                      <div><span className="text-gray-400">Started:</span> <span className="text-gray-300">{formatTime(attempt.started_at)}</span></div>
                      <div><span className="text-gray-400">Answered:</span> <span className="text-gray-300">{formatTime(attempt.answered_at)}</span></div>
                      <div><span className="text-gray-400">Bridged:</span> <span className="text-gray-300">{formatTime(attempt.bridged_at)}</span></div>
                      <div><span className="text-gray-400">Outcome:</span> <span className="text-gray-300">{attempt.system_outcome || "—"}</span></div>
                    </div>
                    {/* Live timers */}
                    <div className="flex gap-4 rounded-md bg-gray-800 p-2 text-center">
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">Duration</div>
                        <div className="text-lg font-bold text-white"><LiveTimer startIso={attempt.started_at} /></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs text-gray-400">Talk</div>
                        <div className="text-lg font-bold text-green-400">
                          {attempt.bridged_at ? <LiveTimer startIso={attempt.bridged_at} /> : "—"}
                        </div>
                      </div>
                    </div>
                    {/* Hangup Button */}
                    <Button
                      onClick={doHangup}
                      disabled={hangupPending}
                      className="h-10 w-full bg-red-600 font-semibold text-white hover:bg-red-500 disabled:opacity-50"
                    >
                      <PhoneOff className="mr-2 h-4 w-4" />
                      {hangupPending ? "Hanging up…" : "Hang Up"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ═══ STATE 2: WRAP-UP ═══ */}
            {isWrapUp && wu && (
              <Card className="border-l-4 border-l-yellow-500 border-yellow-800/50 bg-gray-900">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-base text-yellow-100">
                    <Clock className="h-4 w-4" /> Wrap-Up — Submit Disposition
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {/* Lead + Call summary */}
                  <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                    <div>
                      <div className="text-xs text-gray-400">Lead</div>
                      <div className="font-semibold text-white">
                        {[wu.lead?.first_name, wu.lead?.last_name].filter(Boolean).join(" ") || "Unknown"}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Phone</div>
                      <div className="font-mono text-white">{wu.lead?.phone || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Talk Time</div>
                      <div className="font-mono text-green-400">{formatDuration(wu.call_attempt?.talk_seconds)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Outcome</div>
                      <div className="text-gray-300">{wu.call_attempt?.system_outcome || "—"}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ═══ STATE 3: IDLE / WAITING ═══ */}
            {dialerRunning && isIdle && (
              <Card className="border-gray-700 bg-gray-900">
                <CardContent className="flex items-center justify-center gap-2 py-8 text-sm text-gray-400">
                  <Loader2 className="h-4 w-4 animate-spin" /> Waiting for next lead…
                </CardContent>
              </Card>
            )}

            {/* ═══ Controls + Notes/Disposition ═══ */}
            <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
              {/* Left: Controls + Campaign Status */}
              <div className="flex flex-col gap-4">
                <Card className="border-gray-700 bg-gray-900">
                  <CardHeader><CardTitle className="text-base text-gray-100">Dialer Controls</CardTitle></CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid gap-1 text-sm">
                      <div><span className="text-gray-400">agent:</span> {contract.identity.displayName || contract.identity.email || contract.identity.userId || "—"}</div>
                      <div><span className="text-gray-400">endpoint:</span> {contract.registration.endpoint || contract.identity.userId || "—"}</div>
                      <div>
                        <span className="text-gray-400">registration:</span>{" "}
                        <span className={ariConfirmed ? "text-green-400" : "text-yellow-400"}>
                          {contract.registration.status || "unverified"} ({contract.registration.source || "—"})
                          {!ariConfirmed && <span className="ml-1 text-xs text-yellow-600">(SIP unconfirmed — calls may still work)</span>}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-sm text-gray-300" htmlFor="campaign">Campaign</label>
                      <select
                        id="campaign" value={selectedCampaign} onChange={(e) => setSelectedCampaign(e.target.value)}
                        disabled={dialerRunning}
                        className="h-10 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-blue-500 disabled:opacity-50"
                      >
                        <option value="">Choose a campaign</option>
                        {campaignOptions.map((c) => (<option key={c.campaign_id} value={c.campaign_id}>{c.label}</option>))}
                      </select>
                      {campaignOptions.length === 0 && !loading && contract && (
                        <p className="mt-1 text-xs text-gray-400">
                          {contract.campaign_access.org_has_campaigns
                            ? "You may not have access to any campaigns."
                            : "No campaigns found for this organization."}
                        </p>
                      )}
                    </div>
                    {/* Step 1: Arm session — requires ARI confirmed */}
                    <Button onClick={goReady} disabled={!readyEnabled || readyPending || sessionArmed}
                      className="h-10 w-full bg-green-600 font-semibold text-white hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-300">
                      {readyPending && !agentLegLive ? "Arming…" : sessionArmed ? "✓ Session Armed" : "1. Arm Agent Session"}
                    </Button>
                    {!readyEnabled && !ariConfirmed && hasEndpoint && (
                      <div className="rounded-md border border-yellow-800 bg-yellow-950/40 p-2 text-xs text-yellow-200">
                        <AlertCircle className="mr-1 inline h-3 w-3" /> SIP registration required. Register your softphone first.
                      </div>
                    )}
                    {readyError && <div className="rounded-md border border-red-800 bg-red-950/40 p-2 text-xs text-red-200"><AlertCircle className="mr-1 inline h-3 w-3" /> {readyError}</div>}

                    {/* Step 1.5: Waiting for agent leg */}
                    {sessionArmed && !agentLegLive && (
                      <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-950/30 p-3 text-sm text-blue-200">
                        <Loader2 className="h-4 w-4 animate-spin" /> Connecting agent line… (answer your softphone)
                      </div>
                    )}

                    {/* Step 2: Go Ready — available once agent leg is live */}
                    <Button
                      onClick={goReadyAfterLeg}
                      disabled={!agentLegLive || readyPending || agentReadyForDial || dialerRunning}
                      className="h-10 w-full bg-yellow-600 font-semibold text-white hover:bg-yellow-500 disabled:bg-gray-700 disabled:text-gray-300"
                    >
                      {readyPending && agentLegLive ? "Going Ready…" : agentReadyForDial ? "✓ Agent Ready" : "2. Go Ready"}
                    </Button>

                    {/* Step 3: Start campaign dialer */}
                    <Button onClick={startCampaign} disabled={!agentReadyForDial || campaignStartPending || dialerRunning}
                      className="h-10 w-full bg-blue-600 font-semibold text-white hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-300">
                      {campaignStartPending ? "Starting…" : dialerRunning ? "✓ Dialer Running" : "3. Start Campaign Dialer"}
                    </Button>
                    {startError && <div className="rounded-md border border-red-800 bg-red-950/40 p-2 text-xs text-red-200"><AlertCircle className="mr-1 inline h-3 w-3" /> {startError}</div>}
                    {dialerRunning && (
                      <div className="flex gap-2 pt-1">
                        <Button onClick={togglePause} variant="outline" className="flex-1 border-yellow-700 text-yellow-300 hover:bg-yellow-900/30">
                          {(campaignStatus?.agents?.ready ?? 0) > 0 ? <><Pause className="mr-1 h-4 w-4" /> Pause</> : <><Play className="mr-1 h-4 w-4" /> Resume</>}
                        </Button>
                        <Button onClick={stopCampaign} variant="outline" className="flex-1 border-red-700 text-red-300 hover:bg-red-900/30">
                          <Square className="mr-1 h-4 w-4" /> Stop
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Campaign Status */}
                {dialerRunning && campaignStatus && (
                  <Card className="border-gray-700 bg-gray-900">
                    <CardHeader><CardTitle className="text-base text-gray-100">Campaign Status</CardTitle></CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="grid grid-cols-4 gap-2">
                        <div className="rounded-md bg-gray-800 p-2 text-center">
                          <div className="text-lg font-bold text-blue-400">{campaignStatus.queue.waiting}</div>
                          <div className="text-[10px] text-gray-400">Queued</div>
                        </div>
                        <div className="rounded-md bg-gray-800 p-2 text-center">
                          <div className="text-lg font-bold text-yellow-400">{campaignStatus.queue.active}</div>
                          <div className="text-[10px] text-gray-400">Active</div>
                        </div>
                        <div className="rounded-md bg-gray-800 p-2 text-center">
                          <div className="text-lg font-bold text-green-400">{campaignStatus.queue.completed}</div>
                          <div className="text-[10px] text-gray-400">Done</div>
                        </div>
                        <div className="rounded-md bg-gray-800 p-2 text-center">
                          <div className="text-lg font-bold text-red-400">{campaignStatus.queue.failed}</div>
                          <div className="text-[10px] text-gray-400">Failed</div>
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>Ready: <span className="text-green-400">{campaignStatus.agents.ready}</span></span>
                        <span>In call: <span className="text-yellow-400">{campaignStatus.agents.incall}</span></span>
                        <span>Live: <span className="text-blue-400">{campaignStatus.live_calls_data?.length ?? 0}</span></span>
                        <span>Pending: <span className="text-purple-400">{campaignStatus.leads?.pending ?? 0}</span></span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right: Notes + Disposition */}
              <div className="flex flex-col gap-4">
                {/* Call Notes */}
                <Card className="border-gray-700 bg-gray-900">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <FileText className="h-4 w-4" /> Call Notes
                      {lead && <span className="ml-auto text-xs font-normal text-gray-500">{[lead.first_name, lead.last_name].filter(Boolean).join(" ") || lead.id}</span>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sessionArmed ? (
                      <textarea
                        placeholder={isLiveCall || isWrapUp ? "Notes for this call — saved with disposition…" : "Waiting for active call…"}
                        value={dispositionNotes}
                        onChange={(e) => setDispositionNotes(e.target.value)}
                        rows={4}
                        className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder:text-gray-600 outline-none focus:border-blue-500"
                      />
                    ) : (
                      <p className="text-sm text-gray-500">Arm your session to take notes.</p>
                    )}
                  </CardContent>
                </Card>

                {/* Disposition */}
                <Card className={`border-gray-700 bg-gray-900 ${isWrapUp ? "ring-1 ring-yellow-600" : ""}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base text-gray-100">
                      <Phone className="h-4 w-4" /> Disposition
                      {attempt && (
                        <span className="ml-auto text-xs font-normal text-gray-500">
                          {attempt.id?.slice(0, 8)}…
                        </span>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {isLiveCall ? (
                      <div className="flex items-center gap-2 rounded-md border border-blue-800 bg-blue-950/40 p-3 text-sm text-blue-200">
                        <Phone className="h-4 w-4" /> Call in progress — hang up to disposition
                      </div>
                    ) : !attempt && !isWrapUp ? (
                      <p className="text-sm text-gray-500">No active call to disposition.</p>
                    ) : dispositionDone || attempt?.agent_disposition ? (
                      <div className="flex items-center gap-2 rounded-md border border-green-800 bg-green-950/40 p-3 text-sm text-green-200">
                        <CheckCircle2 className="h-4 w-4" /> Disposition saved: {attempt?.agent_disposition || "submitted"}
                      </div>
                    ) : (
                      <>
                        {isWrapUp && (
                          <div className="flex items-center gap-2 rounded-md border border-yellow-800 bg-yellow-950/40 p-2 text-xs text-yellow-200">
                            <Clock className="h-3 w-3" /> Call ended — submit disposition now
                          </div>
                        )}
                        <div className="grid grid-cols-3 gap-2">
                          {DISPOSITION_OPTIONS.map((d) => (
                            <Button key={d.value} onClick={() => submitDisposition(d.value)} disabled={dispositionPending}
                              className={`${d.color} h-9 text-xs font-medium text-white hover:opacity-80 disabled:opacity-50`}>
                              {d.label}
                            </Button>
                          ))}
                        </div>
                        <div className="space-y-1">
                          <label className="block text-xs text-gray-400" htmlFor="callback-at">Callback date/time</label>
                          <input id="callback-at" type="datetime-local" value={callbackAt} onChange={(e) => setCallbackAt(e.target.value)}
                            className="h-9 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-blue-500" />
                        </div>
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
