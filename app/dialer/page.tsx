"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Phone,
  PhoneOff,
  PhoneCall,
  Pause,
  Play,
  LogOut,
  Clock,
  User,
  Mic,
  MicOff,
  Volume2,
  AlertCircle,
  CheckCircle2,
  RadioTower,
} from "lucide-react";
import { apiPost, apiGet, BACKEND_URL, ORG_ID, USER_ID, getApiHeaders, toWebSocketUrl } from "@/lib/backend";
import { useSoftphone, type SoftphoneConfig } from "@/hooks/use-softphone";

// ── Types ──────────────────────────────────────────────────────────────────────

type AgentState = "OFFLINE" | "READY" | "RESERVED" | "INCALL" | "WRAP" | "PAUSED";

interface AgentSession {
  session_id: string;
  agent_id: string;
  campaign_id: string | null;
  state: AgentState;
  last_state_at: string;
  metadata?: Record<string, unknown> | null;
}

interface LiveCall {
  call_id: string;
  org_id: string;
  campaign_id: string | null;
  contact_id: string | null;
  lead_id: string | null;
  assigned_agent: string | null;
  status: string;
  started_at: string | null;
  metadata: Record<string, unknown> | null;
}

interface Campaign {
  campaign_id: string;
  name: string;
  status: string;
}

interface WsEvent {
  type: string;
  payload?: Record<string, unknown>;
}

interface HumanReadyPayload {
  call_id: string;
  agent_id?: string;
  session_id?: string;
  stage?: string;
  lead_name?: string | null;
  contact_name?: string | null;
  lead_phone?: string | null;
  phone?: string | null;
  metadata?: Record<string, unknown>;
}

type DispositionOutcome =
  | "SALE"
  | "NOT_INTERESTED"
  | "CALLBACK"
  | "BUSY"
  | "NO_ANSWER"
  | "WRONG_NUMBER"
  | "DNC"
  | "OTHER";

const OUTCOME_LABELS: Record<DispositionOutcome, string> = {
  SALE: "Sale / Conversion",
  NOT_INTERESTED: "Not Interested",
  CALLBACK: "Schedule Callback",
  BUSY: "Busy",
  NO_ANSWER: "No Answer",
  WRONG_NUMBER: "Wrong Number",
  DNC: "Do Not Call",
  OTHER: "Other",
};

// ── Badge colours ──────────────────────────────────────────────────────────────

function stateBadge(state: AgentState): string {
  switch (state) {
    case "READY":    return "bg-green-500 text-white";
    case "RESERVED": return "bg-yellow-500 text-white";
    case "INCALL":   return "bg-blue-600 text-white";
    case "WRAP":     return "bg-orange-500 text-white";
    case "PAUSED":   return "bg-gray-500 text-white";
    default:         return "bg-zinc-700 text-white";
  }
}

function normalizeCampaigns(payload: Campaign[]): Campaign[] {
  return [...payload]
    .filter((campaign) => Boolean(campaign.campaign_id))
    .sort((a, b) => (b.status === "active" ? 1 : 0) - (a.status === "active" ? 1 : 0) || a.name.localeCompare(b.name));
}

function findLiveCallForAgent(
  calls: LiveCall[],
  agentId: string,
  sessionId?: string | null,
): LiveCall | null {
  const match = calls.find((call) => {
    const metadata = (call.metadata || {}) as Record<string, unknown>;
    return (
      call.assigned_agent === agentId ||
      metadata.agent_id === agentId ||
      (sessionId ? metadata.session_id === sessionId : false)
    );
  });

  return match ?? null;
}

// ── Call timer hook ────────────────────────────────────────────────────────────

function useCallTimer(active: boolean, startedAt: string | null): string {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active || !startedAt) { setElapsed(0); return; }
    const start = Date.parse(startedAt);
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, startedAt]);

  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const s = elapsed % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function DialerAgentPanel() {
  const DIALER_ORG_ID = "default-tenant";
  const [session, setSession] = useState<AgentSession | null>(null);
  const [callInfo, setCallInfo] = useState<LiveCall | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("");
  const [muted, setMuted] = useState(false);
  const [showDispModal, setShowDispModal] = useState(false);
  const [dispOutcome, setDispOutcome] = useState<DispositionOutcome>("NOT_INTERESTED");
  const [dispNotes, setDispNotes] = useState("");
  const [dispCallbackDate, setDispCallbackDate] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [softphoneConfig, setSoftphoneConfig] = useState<SoftphoneConfig | null>(null);
  const [wrapUntil, setWrapUntil] = useState<string | null>(null);
  const [humanReady, setHumanReady] = useState<HumanReadyPayload | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const sessionDebugRef = useRef<string | null>(null);
  const campaignsDebugRef = useRef<string | null>(null);
  const uiStateDebugRef = useRef<string | null>(null);
  const campaignFetchDebugLoggedRef = useRef(false);
  const softphone = useSoftphone(softphoneConfig);
  const agentId = softphoneConfig?.agent_id || USER_ID;

  const logSessionPayload = useCallback((nextSession: AgentSession | null) => {
    const serialized = JSON.stringify(nextSession);
    if (sessionDebugRef.current === serialized) return;
    sessionDebugRef.current = serialized;
    console.debug("[dialer] session payload received", nextSession);
  }, []);

  const logCampaignsPayload = useCallback((nextCampaigns: Campaign[]) => {
    const serialized = JSON.stringify(nextCampaigns);
    if (campaignsDebugRef.current === serialized) return;
    campaignsDebugRef.current = serialized;
    console.debug("[dialer] campaigns payload received", nextCampaigns);
  }, []);

  const logUiState = useCallback((nextState: Record<string, unknown>) => {
    const serialized = JSON.stringify(nextState);
    if (uiStateDebugRef.current === serialized) return;
    uiStateDebugRef.current = serialized;
    console.debug("[dialer] normalized UI state derived from backend", nextState);
  }, []);

  const callTimer = useCallTimer(
    session?.state === "INCALL",
    callInfo?.started_at ?? null,
  );

  const [wrapCountdown, setWrapCountdown] = useState(0);

  useEffect(() => {
    if (!wrapUntil) {
      setWrapCountdown(0);
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.ceil((Date.parse(wrapUntil) - Date.now()) / 1000));
      setWrapCountdown(remaining);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [wrapUntil]);

  // ── Load campaigns ──────────────────────────────────────────────────────────

  const refreshCampaigns = useCallback(async () => {
    const requestUrl = `${BACKEND_URL}/campaigns?org_id=${encodeURIComponent(DIALER_ORG_ID)}`;
    try {
      const response = await fetch(requestUrl, {
        headers: getApiHeaders(DIALER_ORG_ID),
        cache: "no-store",
      });
      const rawBody = await response.text();

      if (!campaignFetchDebugLoggedRef.current) {
        campaignFetchDebugLoggedRef.current = true;
        console.debug("[dialer] campaign fetch debug", {
          backendUrl: BACKEND_URL,
          orgId: DIALER_ORG_ID,
          envOrgId: ORG_ID,
          userId: USER_ID,
          agentId,
          requestUrl,
          responseStatus: response.status,
          rawResponseBody: rawBody,
        });
      }

      if (!response.ok) {
        throw new Error(rawBody || `Campaign request failed: ${response.status}`);
      }

      const payload = (rawBody ? JSON.parse(rawBody) : []) as Campaign[];
      const normalized = normalizeCampaigns(payload);
      setCampaigns(normalized);
      logCampaignsPayload(normalized);
      setSelectedCampaign((current) => {
        if (current && normalized.some((campaign) => campaign.campaign_id === current)) {
          return current;
        }
        if (session?.campaign_id && normalized.some((campaign) => campaign.campaign_id === session.campaign_id)) {
          return session.campaign_id;
        }
        if (normalized.length === 1) {
          return normalized[0].campaign_id;
        }
        return current;
      });
    } catch {
      // non-fatal
    }
  }, [DIALER_ORG_ID, agentId, logCampaignsPayload, session?.campaign_id]);

  useEffect(() => {
    void refreshCampaigns();
  }, [refreshCampaigns]);

  useEffect(() => {
    fetch("/api/dialer/agents/self/softphone", { cache: "no-store" })
      .then(async (res) => {
        const body = (await res.json()) as SoftphoneConfig | { error?: string };
        if (!res.ok) {
          throw new Error((body as { error?: string }).error || "Failed to load softphone config");
        }
        setSoftphoneConfig(body as SoftphoneConfig);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load softphone config");
      });
  }, []);

  // ── Restore session on mount ────────────────────────────────────────────────

  const refreshDialerState = useCallback(async () => {
    try {
      const [{ session: nextSession }, liveCalls] = await Promise.all([
        apiGet<{ session: AgentSession }>(`/dialer/agents/${agentId}/session`, DIALER_ORG_ID),
        apiGet<LiveCall[]>(`/dialer/calls/live?limit=100`, DIALER_ORG_ID),
      ]);

      setSession(nextSession);
      logSessionPayload(nextSession);
      if (nextSession.campaign_id) {
        setSelectedCampaign(nextSession.campaign_id);
      }

      const nextCall = findLiveCallForAgent(liveCalls, agentId, nextSession.session_id);
      setCallInfo(nextCall);
      if (!nextCall && nextSession.state !== "INCALL") {
        setHumanReady(null);
      }
    } catch {
      setSession(null);
      setCallInfo(null);
    }
  }, [DIALER_ORG_ID, agentId, logSessionPayload]);

  useEffect(() => {
    void refreshDialerState();
    const intervalId = window.setInterval(() => {
      void refreshDialerState();
    }, 5000);
    return () => window.clearInterval(intervalId);
  }, [refreshDialerState]);

  // ── WebSocket subscription ──────────────────────────────────────────────────

  const connectWs = useCallback(() => {
    const wsUrl = `${toWebSocketUrl(BACKEND_URL)}/ws?org_id=${DIALER_ORG_ID}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => setStatusMsg("Live events connected");
    ws.onclose = () => setTimeout(connectWs, 3000); // auto-reconnect
    ws.onerror = () => ws.close();

    ws.onmessage = (ev) => {
      let evt: WsEvent;
      try { evt = JSON.parse(ev.data as string); } catch { return; }

      if (evt.type === "agent.state") {
        const payload = evt.payload ?? {};
        if (payload.agent_id === agentId) {
          void refreshDialerState();

          // Show disposition modal on WRAP
          if (payload.to_state === "WRAP") {
            setShowDispModal(true);
            setStatusMsg("Call ended — wrap up and disposition");
          }

          if (payload.to_state === "READY") {
            setWrapUntil(null);
            setHumanReady(null);
            setCallInfo(null);
            setShowDispModal(false);
          }
        }
      }

      if (evt.type === "call.human_ready") {
        const payload = evt.payload ?? {};
        if (payload.agent_id === agentId) {
          setHumanReady({
            call_id: String(payload.call_id ?? ""),
            agent_id: typeof payload.agent_id === "string" ? payload.agent_id : undefined,
            session_id: typeof payload.session_id === "string" ? payload.session_id : undefined,
            stage: typeof payload.stage === "string" ? payload.stage : undefined,
            lead_name: typeof payload.lead_name === "string" ? payload.lead_name : null,
            contact_name: typeof payload.contact_name === "string" ? payload.contact_name : null,
            lead_phone: typeof payload.lead_phone === "string" ? payload.lead_phone : null,
            phone: typeof payload.phone === "string" ? payload.phone : null,
            metadata: (payload.metadata || {}) as Record<string, unknown>,
          });
          setStatusMsg(
            payload.stage === "beeping"
              ? "Human detected — beeping agent"
              : "Human detected — alerting agent",
          );
          void refreshDialerState();
        }
      }

      if (evt.type === "call.bridged") {
        setHumanReady(null);
        setWrapUntil(null);
        setStatusMsg("Live call connected");
        void refreshDialerState();
      }

      if (evt.type === "call.wrap") {
        const payload = evt.payload ?? {};
        if (payload.agent_id === agentId || session?.state === "INCALL") {
          if (typeof payload.wrap_until === "string") {
            setWrapUntil(payload.wrap_until);
          }
          setShowDispModal(true);
          setStatusMsg("Wrap time started");
          void refreshDialerState();
        }
      }

      if (evt.type === "call.event") {
        const payload = evt.payload ?? {};
        const action = payload.action as string | undefined;
        if ((action === "call.ended" || action === "ended") && callInfo?.call_id === (payload.call_id as string)) {
          setStatusMsg("Call ended — wrap time");
          void refreshDialerState();
        }
      }

      if (
        evt.type === "call.amd_result" ||
        evt.type === "queue.lead_dialing" ||
        evt.type === "queue.lead_answered"
      ) {
        void refreshDialerState();
      }
    };

    wsRef.current = ws;
    return ws;
  }, [DIALER_ORG_ID, agentId, callInfo?.call_id, refreshDialerState, session?.state]);

  useEffect(() => {
    const ws = connectWs();
    return () => ws.close();
  }, [connectWs]);

  // ── Agent actions ───────────────────────────────────────────────────────────

  async function goReady() {
    if (!selectedCampaign) { setError("Select a campaign first"); return; }
    if (!softphoneConfig?.endpoint) { setError("Softphone endpoint is not configured"); return; }
    const browserSoftphoneConfigured = Boolean(
      softphoneConfig?.sip_uri &&
      softphoneConfig?.authorization_username &&
      softphoneConfig?.password &&
      softphoneConfig?.ws_server,
    );
    const externalPhoneMode = Boolean(softphoneConfig?.endpoint) && !browserSoftphoneConfigured;
    if (!externalPhoneMode && !softphone.isRegistered) {
      setError("Softphone must be registered before going READY");
      return;
    }
    setError(null);
    try {
      const res = await apiPost<{ session: AgentSession }>("/dialer/agents/session", {
        agent_id: agentId,
        campaign_id: selectedCampaign,
        endpoint: softphoneConfig.endpoint,
        softphone: softphoneConfig,
      }, DIALER_ORG_ID);
      setSession(res.session);
      setStatusMsg("You are now READY to receive calls");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to go ready");
    }
  }

  async function transitionState(state: AgentState, reason?: string) {
    if (!session) return;
    setError(null);
    try {
      const res = await apiPost<{ session: AgentSession }>(
        `/dialer/agents/${session.session_id}/state`,
        { state, reason },
        DIALER_ORG_ID,
      );
      setSession(res.session);
    } catch (e) {
      setError(e instanceof Error ? e.message : "State change failed");
    }
  }

  async function endCall() {
    if (!callInfo) return;
    setError(null);
    try {
      await apiPost("/telephony/calls/end", {
        org_id: DIALER_ORG_ID,
        agent_id: agentId,
        call_id: callInfo.call_id,
      }, DIALER_ORG_ID);
      // INCALL → WRAP will come via WebSocket
    } catch (e) {
      setError(e instanceof Error ? e.message : "End call failed");
    }
  }

  async function submitDisposition() {
    if (!session || !callInfo) return;
    setError(null);
    try {
      await apiPost(`/dialer/calls/${callInfo.call_id}/disposition`, {
        outcome: dispOutcome,
        notes: dispNotes || undefined,
        callback_at: dispOutcome === "CALLBACK" && dispCallbackDate ? dispCallbackDate : undefined,
        session_id: session.session_id,
      }, DIALER_ORG_ID);
      setShowDispModal(false);
      setDispNotes("");
      setDispCallbackDate("");
      setCallInfo(null);
      setWrapUntil(null);
      setHumanReady(null);
      setStatusMsg("Disposition saved — returning to READY");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Disposition failed");
    }
  }

  async function toggleMute() {
    // Mute is managed locally (media control handled by WebRTC/SIP stack on client)
    setMuted((m) => !m);
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const agentState: AgentState = session?.state ?? "OFFLINE";
  const isOffline = agentState === "OFFLINE";
  const isReady = agentState === "READY";
  const isReserved = agentState === "RESERVED";
  const isInCall = agentState === "INCALL";
  const isWrap = agentState === "WRAP";
  const isPaused = agentState === "PAUSED";
  const browserSoftphoneConfigured = Boolean(
    softphoneConfig?.sip_uri &&
    softphoneConfig?.authorization_username &&
    softphoneConfig?.password &&
    softphoneConfig?.ws_server,
  );
  const externalPhoneMode = Boolean(softphoneConfig?.endpoint) && !browserSoftphoneConfigured;
  const softphoneStatusLabel =
    externalPhoneMode
      ? "External SIP Phone"
      : softphone.status === "registered"
      ? "Registered"
      : softphone.status === "connecting"
        ? "Registering..."
        : softphone.status === "error"
          ? "Softphone Error"
          : "Softphone Idle";
  const autoNextEnabled = Boolean(session) && ["READY", "RESERVED", "WRAP"].includes(agentState);
  const hasSelectedCampaign = selectedCampaign.trim().length > 0;
  const softphoneReadyForDialing = externalPhoneMode || softphone.isRegistered;
  const canGoReady = hasSelectedCampaign && softphoneReadyForDialing;
  const sessionMetadata = (session?.metadata || {}) as Record<string, unknown>;
  const displayedEndpoint =
    (typeof sessionMetadata.endpoint === "string" && sessionMetadata.endpoint) ||
    (typeof softphoneConfig?.endpoint === "string" && softphoneConfig.endpoint) ||
    null;

  const lead = callInfo?.metadata as Record<string, unknown> | null;
  const leadName =
    humanReady?.lead_name ??
    humanReady?.contact_name ??
    lead?.lead_name ??
    lead?.contact_name ??
    "Unknown Lead";
  const leadPhone =
    humanReady?.lead_phone ??
    humanReady?.phone ??
    lead?.phone ??
    (typeof callInfo?.metadata?.endpoint === "string" ? callInfo.metadata.endpoint : "—");

  useEffect(() => {
    logUiState({
      agentId,
      externalPhoneMode,
      selectedCampaign,
      sessionState: session?.state ?? "OFFLINE",
      sessionId: session?.session_id ?? null,
      callId: callInfo?.call_id ?? null,
      callStatus: callInfo?.status ?? null,
      displayedEndpoint,
      campaignCount: campaigns.length,
    });
  }, [
    agentId,
    callInfo?.call_id,
    callInfo?.status,
    campaigns.length,
    displayedEndpoint,
    externalPhoneMode,
    logUiState,
    selectedCampaign,
    session?.session_id,
    session?.state,
  ]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-4">

        {/* ── Header ── */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-blue-400" />
            <h1 className="text-xl font-bold">Agent Dial Panel</h1>
          </div>
          <Badge className={`text-sm px-3 py-1 ${stateBadge(agentState)}`}>
            {agentState}
          </Badge>
        </div>

        {/* ── Status / Error messages ── */}
        {error && (
          <div className="flex items-center gap-2 bg-red-900/40 border border-red-700 rounded-lg p-3 text-sm text-red-300">
            <AlertCircle className="h-4 w-4 shrink-0" />{error}
          </div>
        )}
        {statusMsg && !error && (
          <div className="flex items-center gap-2 bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-sm text-blue-300">
            <CheckCircle2 className="h-4 w-4 shrink-0" />{statusMsg}
          </div>
        )}

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-sm text-gray-400">Phone</div>
              <div className="text-sm text-white font-medium">External SIP Phone</div>
              {displayedEndpoint ? (
                <div className="text-xs text-gray-200 font-mono">Endpoint {displayedEndpoint}</div>
              ) : (
                <div className="text-xs text-red-400">No endpoint configured in agent softphone metadata</div>
              )}
              {displayedEndpoint ? (
                <div className="text-xs text-gray-400 mt-1">This phone is the active agent device</div>
              ) : null}
              {!externalPhoneMode && softphone.error ? (
                <div className="text-xs text-red-400 mt-1">{softphone.error}</div>
              ) : null}
            </div>
            <Badge className={(externalPhoneMode || softphone.isRegistered) ? "bg-green-600 text-white" : "bg-gray-700 text-white"}>
              {(externalPhoneMode || softphone.isRegistered) ? "Active Device" : softphoneStatusLabel}
            </Badge>
          </CardContent>
        </Card>

        {/* ── Campaign selector (only when offline) ── */}
        {isOffline && (
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="text-base text-gray-200">Campaign</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <select
                  value={selectedCampaign}
                  onChange={(event) => setSelectedCampaign(event.target.value)}
                  className="w-full h-11 rounded-md border border-gray-600 bg-gray-800 px-3 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                >
                  <option value="" disabled>
                    Choose a campaign to go READY
                  </option>
                  {campaigns.map((campaign) => (
                    <option key={campaign.campaign_id} value={campaign.campaign_id}>
                      {campaign.name}
                    </option>
                  ))}
                </select>
                {campaigns.length === 0 ? (
                  <p className="text-xs text-red-300">No campaigns were loaded for this org yet.</p>
                ) : null}
              </div>

              {!hasSelectedCampaign ? (
                <p className="text-xs text-yellow-300">Select a campaign before going READY.</p>
              ) : (
                <p className="text-xs text-green-300">Campaign selected. You can now go READY.</p>
              )}

              <Button
                onClick={goReady}
                disabled={!canGoReady}
                className={`w-full h-11 text-white font-semibold ${
                  canGoReady
                    ? "bg-green-600 hover:bg-green-500"
                    : "bg-gray-700 text-gray-300 hover:bg-gray-700"
                }`}
              >
                <Phone className="h-4 w-4 mr-2" />
                {!hasSelectedCampaign
                  ? "Select Campaign To Continue"
                  : softphoneReadyForDialing
                    ? "Go Ready"
                    : "Waiting For Softphone"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Waiting for call (READY / RESERVED) ── */}
        {(isReady || isReserved) && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-6 pb-4 text-center space-y-4">
              <div className="flex items-center justify-center gap-2 text-green-400">
                {isReserved ? (
                  <>
                    <PhoneCall className="h-8 w-8 animate-pulse" />
                    <span className="text-lg font-medium">Connecting call…</span>
                  </>
                ) : (
                  <>
                    <Phone className="h-8 w-8" />
                    <span className="text-lg font-medium">Waiting for next call</span>
                  </>
                )}
              </div>

              {session?.campaign_id && (
                <p className="text-sm text-gray-400">
                  Campaign: <span className="text-white">
                    {campaigns.find((c) => c.campaign_id === session.campaign_id)?.name ?? session.campaign_id}
                  </span>
                </p>
              )}

              {humanReady ? (
                <div className="rounded-lg border border-yellow-700 bg-yellow-900/30 px-4 py-3 text-sm text-yellow-200">
                  {humanReady.stage === "beeping" ? "Human detected. Playing agent beep..." : "Human detected. Alerting agent..."}
                </div>
              ) : null}

              <p className="text-xs text-gray-500">
                Auto-next: <span className="text-white">{autoNextEnabled ? "Armed" : "Idle"}</span>
              </p>

              <div className="flex gap-2 justify-center">
                {isReady && (
                  <Button
                    variant="outline"
                    onClick={() => transitionState("PAUSED", "manual_pause")}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Pause
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => transitionState("OFFLINE", "logout")}
                  className="border-red-800 text-red-400 hover:bg-red-900/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Off
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ── Active call (INCALL) ── */}
        {isInCall && (
          <Card className="bg-blue-950 border-blue-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-blue-300">
                <div className="flex items-center gap-2">
                  <PhoneCall className="h-5 w-5 animate-pulse" />
                  On Call
                </div>
                <span className="font-mono text-lg text-white flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {callTimer}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Lead details */}
              <div className="bg-blue-900/40 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="font-medium text-white">{String(leadName)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-blue-400" />
                  <span className="text-gray-300 font-mono">{String(leadPhone)}</span>
                </div>
              </div>

              {/* Call controls */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={toggleMute}
                  className={`flex-1 border-gray-600 ${muted ? "bg-red-900/30 border-red-700 text-red-300" : "text-gray-300 hover:bg-gray-700"}`}
                >
                  {muted ? <MicOff className="h-4 w-4 mr-2" /> : <Mic className="h-4 w-4 mr-2" />}
                  {muted ? "Unmute" : "Mute"}
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
                >
                  <Volume2 className="h-4 w-4 mr-2" />
                  Hold
                </Button>
                <Button
                  onClick={endCall}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white"
                >
                  <PhoneOff className="h-4 w-4 mr-2" />
                  End Call
                </Button>
              </div>

              {callInfo?.call_id && (
                <p className="text-xs text-gray-500 text-center font-mono">
                  Call ID: {callInfo.call_id}
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {/* ── Wrap state indicator (disposition modal auto-shows) ── */}
        {isWrap && (
          <Card className="bg-orange-950 border-orange-700">
            <CardContent className="pt-6 pb-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-orange-300">
                <Clock className="h-6 w-6" />
                <span className="text-base font-medium">Wrap — submit disposition</span>
              </div>
              {wrapCountdown > 0 ? (
                <div className="text-sm text-orange-200">Auto-ready in {wrapCountdown}s</div>
              ) : null}
              <Button
                onClick={() => setShowDispModal(true)}
                className="bg-orange-600 hover:bg-orange-500 text-white"
              >
                Open Disposition
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── Paused card ── */}
        {isPaused && (
          <Card className="bg-gray-900 border-gray-700">
            <CardContent className="pt-6 pb-4 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-gray-400">
                <Pause className="h-6 w-6" />
                <span className="text-base font-medium">Paused</span>
              </div>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={() => transitionState("READY", "resume")}
                  className="bg-green-600 hover:bg-green-500 text-white"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </Button>
                <Button
                  variant="outline"
                  onClick={() => transitionState("OFFLINE", "logout")}
                  className="border-red-800 text-red-400 hover:bg-red-900/30"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Off
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

      </div>

      {/* ── Disposition Modal ─────────────────────────────────────────────── */}
      <audio ref={softphone.audioRef} autoPlay playsInline />
      <Dialog open={showDispModal} onOpenChange={setShowDispModal}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-orange-400" />
              Call Disposition
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Select the outcome for this call before returning to ready.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Outcome grid */}
            <div className="grid grid-cols-2 gap-2">
              {(Object.entries(OUTCOME_LABELS) as [DispositionOutcome, string][]).map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => setDispOutcome(key)}
                  className={`rounded-lg border px-3 py-2 text-sm text-left transition-colors ${
                    dispOutcome === key
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Callback date */}
            {dispOutcome === "CALLBACK" && (
              <div className="space-y-1">
                <label className="text-xs text-gray-400">Callback date/time</label>
                <input
                  type="datetime-local"
                  value={dispCallbackDate}
                  onChange={(e) => setDispCallbackDate(e.target.value)}
                  className="w-full rounded-md bg-gray-800 border border-gray-600 px-3 py-2 text-sm text-white"
                />
              </div>
            )}

            {/* Notes */}
            <div className="space-y-1">
              <label className="text-xs text-gray-400">Notes (optional)</label>
              <Textarea
                value={dispNotes}
                onChange={(e) => setDispNotes(e.target.value)}
                placeholder="Add call notes…"
                className="bg-gray-800 border-gray-600 text-white placeholder-gray-500 min-h-[80px]"
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDispModal(false)}
                className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700"
              >
                Cancel
              </Button>
              <Button
                onClick={submitDisposition}
                className="flex-1 bg-blue-600 hover:bg-blue-500 text-white"
              >
                Submit & Ready
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
