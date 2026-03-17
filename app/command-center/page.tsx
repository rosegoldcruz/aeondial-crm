'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  apiGet,
  apiPost,
  BACKEND_URL,
  ORG_ID,
  USER_ID,
  toWebSocketUrl,
  getApiHeaders,
} from '@/lib/backend';

type UserRow = {
  user_id: string;
  org_id: string;
  email: string;
  full_name?: string | null;
  role: 'owner' | 'admin' | 'agent';
  status: string;
};

type CallRow = {
  call_id: string;
  status: string;
  direction: 'inbound' | 'outbound';
  campaign_id: string | null;
  contact_id: string | null;
  metadata?: Record<string, unknown>;
  created_at?: string;
};

type ProviderStack = {
  llm_provider: string;
  tts_provider: string;
  stt_provider: string;
  voice_id: string;
  model_id: string;
};

type WsEvent = {
  type:
    | 'agent.presence'
    | 'call.event'
    | 'queue.metrics'
    | 'ai.whisper'
    | 'supervisor.control'
    | 'ws.connected';
  org_id: string;
  campaign_id?: string;
  payload?: Record<string, unknown>;
};

export default function CommandCenterPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [providers, setProviders] = useState<ProviderStack | null>(null);
  const [calls, setCalls] = useState<CallRow[]>([]);
  const [activity, setActivity] = useState<string[]>([]);
  const [whispers, setWhispers] = useState<string[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  const [campaignId, setCampaignId] = useState('default-campaign');
  const [contactId, setContactId] = useState('default-contact');
  const [agentId, setAgentId] = useState(USER_ID);
  const [activeCallId, setActiveCallId] = useState('');
  const [targetCallId, setTargetCallId] = useState('');
  const [transferTarget, setTransferTarget] = useState('');
  const [disposition, setDisposition] = useState('');
  const [whisperText, setWhisperText] = useState('');
  const [loading, setLoading] = useState(false);

  const activeAgents = useMemo(
    () => users.filter((u) => u.role === 'agent' && u.status === 'active').length,
    [users],
  );

  const activeCalls = useMemo(
    () => calls.filter((c) => c.status !== 'completed').length,
    [calls],
  );

  const queueDepth = useMemo(
    () => calls.filter((c) => c.status === 'queued' || c.status === 'originated').length,
    [calls],
  );

  const addActivity = (line: string) => {
    setActivity((prev) => [line, ...prev].slice(0, 30));
  };

  const fetchOrgData = async () => {
    setLoading(true);
    try {
      const [usersData, providerData] = await Promise.all([
        apiGet<UserRow[]>(`/users?org_id=${encodeURIComponent(ORG_ID)}`),
        apiGet<ProviderStack>(
          `/ai/providers?org_id=${encodeURIComponent(ORG_ID)}&campaign_id=${encodeURIComponent(
            campaignId,
          )}`,
        ),
      ]);

      setUsers(usersData || []);
      setProviders(providerData);
      addActivity('Loaded org-scoped users and provider stack');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load command center data';
      toast({ title: 'Load failed', description: message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgData();
  }, [campaignId]);

  useEffect(() => {
    const wsUrl = `${toWebSocketUrl(BACKEND_URL)}/ws?org_id=${encodeURIComponent(ORG_ID)}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsConnected(true);
      addActivity('WebSocket connected');
      ws.send(
        JSON.stringify({
          type: 'agent.presence',
          org_id: ORG_ID,
          campaign_id: campaignId,
          payload: { agent_id: agentId, status: 'online' },
        }),
      );
    };

    ws.onclose = () => {
      setWsConnected(false);
      addActivity('WebSocket disconnected');
    };

    ws.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as WsEvent;
        if (parsed.org_id !== ORG_ID) {
          return;
        }

        if (parsed.type === 'call.event') {
          const payload = parsed.payload || {};
          setCalls((prev) => {
            const callId = String(payload.call_id || '');
            if (!callId) return prev;
            const idx = prev.findIndex((c) => c.call_id === callId);
            const next: CallRow = {
              call_id: callId,
              status: String(payload.status || 'unknown'),
              direction: (payload.direction as 'inbound' | 'outbound') || 'outbound',
              campaign_id: String(payload.campaign_id || campaignId),
              contact_id: String(payload.contact_id || contactId),
              metadata: payload,
              created_at: new Date().toISOString(),
            };
            if (idx >= 0) {
              const copy = [...prev];
              copy[idx] = next;
              return copy;
            }
            return [next, ...prev].slice(0, 50);
          });
        }

        if (parsed.type === 'ai.whisper') {
          const text = String(parsed.payload?.message || parsed.payload?.text || 'Whisper event');
          setWhispers((prev) => [text, ...prev].slice(0, 20));
        }

        addActivity(`${parsed.type} received`);
      } catch {
        addActivity('Received malformed websocket message');
      }
    };

    return () => {
      ws.close();
    };
  }, [agentId, campaignId, contactId]);

  const emitWs = (event: WsEvent) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      toast({ title: 'Socket offline', description: 'WebSocket is not connected', variant: 'destructive' });
      return;
    }
    wsRef.current.send(JSON.stringify(event));
  };

  const callApi = async (path: string, body: Record<string, unknown>) => {
    try {
      const response = await apiPost<{ success: boolean; call?: CallRow }>(path, body);
      if (response.call) {
        setCalls((prev) => [response.call!, ...prev.filter((c) => c.call_id !== response.call!.call_id)]);
        setActiveCallId(response.call.call_id);
      }
      toast({ title: 'Success', description: `${path} completed` });
      addActivity(`${path} completed`);
      return response;
    } catch (error) {
      const message = error instanceof Error ? error.message : `${path} failed`;
      toast({ title: 'Request failed', description: message, variant: 'destructive' });
      throw error;
    }
  };

  const originateCall = async () => {
    const payload = {
      org_id: ORG_ID,
      agent_id: agentId,
      campaign_id: campaignId,
      contact_id: contactId,
      direction: 'outbound',
    };
    const res = await callApi('/telephony/calls/originate', payload);
    if (res.call) {
      emitWs({
        type: 'call.event',
        org_id: ORG_ID,
        campaign_id: campaignId,
        payload: {
          call_id: res.call.call_id,
          status: 'originated',
          direction: 'outbound',
          campaign_id: campaignId,
          contact_id: contactId,
        },
      });
    }
  };

  const bridgeCall = async () => {
    if (!activeCallId) return;
    await callApi('/telephony/calls/bridge', {
      org_id: ORG_ID,
      agent_id: agentId,
      campaign_id: campaignId,
      contact_id: contactId,
      call_id: activeCallId,
      bridge_to_call_id: targetCallId || null,
    });
  };

  const transferCall = async () => {
    if (!activeCallId) return;
    await callApi('/telephony/calls/transfer', {
      org_id: ORG_ID,
      agent_id: agentId,
      campaign_id: campaignId,
      contact_id: contactId,
      call_id: activeCallId,
      transfer_target: transferTarget || null,
    });
  };

  const dispositionCall = async () => {
    if (!activeCallId) return;
    await callApi('/telephony/calls/disposition', {
      org_id: ORG_ID,
      agent_id: agentId,
      campaign_id: campaignId,
      contact_id: contactId,
      call_id: activeCallId,
      disposition,
      notes: disposition,
    });
  };

  const endCall = async () => {
    if (!activeCallId) return;
    await callApi('/telephony/calls/end', {
      org_id: ORG_ID,
      agent_id: agentId,
      campaign_id: campaignId,
      contact_id: contactId,
      call_id: activeCallId,
    });
    setActiveCallId('');
  };

  const sendWhisper = async () => {
    if (!whisperText) return;

    try {
      await fetch(`${BACKEND_URL}/ai/events`, {
        method: 'POST',
        headers: getApiHeaders(ORG_ID),
        body: JSON.stringify({
          org_id: ORG_ID,
          campaign_id: campaignId,
          type: 'transfer',
          payload: {
            mode: 'whisper',
            target_call_id: activeCallId,
            message: whisperText,
          },
        }),
      });

      emitWs({
        type: 'ai.whisper',
        org_id: ORG_ID,
        campaign_id: campaignId,
        payload: { message: whisperText, call_id: activeCallId, agent_id: agentId },
      });

      setWhispers((prev) => [whisperText, ...prev].slice(0, 20));
      setWhisperText('');
      toast({ title: 'Whisper sent', description: 'Whisper event published' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to send whisper';
      toast({ title: 'Whisper failed', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-black p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-orange-500">Command Center</h1>
          <p className="text-gray-400 text-sm">Org-scoped live operations, telephony controls, and AI supervision.</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Badge className={wsConnected ? 'bg-green-600' : 'bg-red-600'}>
            {wsConnected ? 'WebSocket Live' : 'WebSocket Offline'}
          </Badge>
          <Badge className="bg-neutral-800 text-neutral-200">{ORG_ID}</Badge>
          <Button onClick={fetchOrgData} disabled={loading} className="bg-orange-500 hover:bg-orange-600">
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-sm text-gray-300">Active Agents</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{activeAgents}</div></CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-sm text-gray-300">Active Calls</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{activeCalls}</div></CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-sm text-gray-300">Queue Depth</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-bold text-white">{queueDepth}</div></CardContent>
        </Card>
        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-sm text-gray-300">AI Stack</CardTitle></CardHeader>
          <CardContent>
            <div className="text-xs text-gray-300 space-y-1">
              <div>LLM: {providers?.llm_provider || '-'}</div>
              <div>TTS: {providers?.tts_provider || '-'}</div>
              <div>STT: {providers?.stt_provider || '-'}</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="bg-neutral-900 border-neutral-800 xl:col-span-2">
          <CardHeader><CardTitle className="text-white">Telephony Controls</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Input value={campaignId} onChange={(e) => setCampaignId(e.target.value)} placeholder="campaign_id" className="bg-black border-neutral-700 text-white" />
              <Input value={contactId} onChange={(e) => setContactId(e.target.value)} placeholder="contact_id" className="bg-black border-neutral-700 text-white" />
              <Input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="agent_id" className="bg-black border-neutral-700 text-white" />
              <Input value={activeCallId} onChange={(e) => setActiveCallId(e.target.value)} placeholder="active call_id" className="bg-black border-neutral-700 text-white" />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={originateCall} className="bg-orange-500 hover:bg-orange-600">Originate</Button>
              <Input value={targetCallId} onChange={(e) => setTargetCallId(e.target.value)} placeholder="bridge_to_call_id" className="w-56 bg-black border-neutral-700 text-white" />
              <Button onClick={bridgeCall} variant="secondary">Bridge</Button>
              <Input value={transferTarget} onChange={(e) => setTransferTarget(e.target.value)} placeholder="transfer target" className="w-56 bg-black border-neutral-700 text-white" />
              <Button onClick={transferCall} variant="secondary">Transfer</Button>
              <Input value={disposition} onChange={(e) => setDisposition(e.target.value)} placeholder="disposition" className="w-48 bg-black border-neutral-700 text-white" />
              <Button onClick={dispositionCall} variant="secondary">Disposition</Button>
              <Button onClick={endCall} disabled={!activeCallId} className="bg-red-600 hover:bg-red-700 text-white">End Call</Button>
            </div>

            <div className="border border-neutral-800 rounded-md overflow-hidden">
              <div className="px-3 py-2 text-sm text-gray-300 bg-neutral-800">Live Calls</div>
              <div className="max-h-72 overflow-y-auto divide-y divide-neutral-800">
                {calls.length === 0 && (
                  <div className="p-3 text-sm text-gray-500">No calls yet</div>
                )}
                {calls.map((call) => (
                  <div key={call.call_id} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="text-white font-mono">{call.call_id}</div>
                      <div className="text-gray-400">{call.campaign_id} · {call.contact_id}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-neutral-800 text-neutral-200">{call.status}</Badge>
                      {!['ended', 'completed', 'transferred', 'failed'].includes(call.status) && (
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          onClick={async () => {
                            await callApi('/telephony/calls/end', {
                              org_id: ORG_ID,
                              agent_id: agentId,
                              campaign_id: call.campaign_id || campaignId,
                              contact_id: call.contact_id || contactId,
                              call_id: call.call_id,
                            });
                            setActiveCallId('');
                          }}
                        >
                          End
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-neutral-900 border-neutral-800">
          <CardHeader><CardTitle className="text-white">AI Whisper Panel</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Input value={whisperText} onChange={(e) => setWhisperText(e.target.value)} placeholder="Type whisper message" className="bg-black border-neutral-700 text-white" />
            <Button onClick={sendWhisper} className="w-full bg-orange-500 hover:bg-orange-600">Send Whisper</Button>
            <div className="text-xs text-gray-500">Whispers are published to WebSocket + AI events.</div>
            <div className="max-h-64 overflow-y-auto border border-neutral-800 rounded-md divide-y divide-neutral-800">
              {whispers.length === 0 && <div className="p-2 text-sm text-gray-500">No whisper events yet</div>}
              {whispers.map((w, idx) => (
                <div key={`${w}-${idx}`} className="p-2 text-sm text-gray-200">{w}</div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-neutral-900 border-neutral-800">
        <CardHeader><CardTitle className="text-white">Real-time Activity</CardTitle></CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto border border-neutral-800 rounded-md divide-y divide-neutral-800">
            {activity.length === 0 && <div className="p-3 text-sm text-gray-500">No activity yet</div>}
            {activity.map((line, i) => (
              <div key={`${line}-${i}`} className="p-3 text-sm text-gray-200">{line}</div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
