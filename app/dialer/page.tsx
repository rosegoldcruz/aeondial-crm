"use client";

import { useEffect, useMemo, useState } from "react";
import { CreateOrganization, OrganizationSwitcher, SignedIn } from "@clerk/nextjs";
import { AlertCircle, CheckCircle2, Loader2, RadioTower } from "lucide-react";
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

interface ReadyResult {
  ok: boolean;
  status: number;
  text: string;
}

interface CampaignOption {
  campaign_id: string;
  label: string;
}

function extractCampaigns(raw: unknown): JsonRecord[] {
  if (Array.isArray(raw)) {
    return raw.filter((item): item is JsonRecord => Boolean(item) && typeof item === "object");
  }

  if (raw && typeof raw === "object") {
    const record = raw as {
      campaigns?: unknown[];
      data?: unknown[];
      items?: unknown[];
      results?: unknown[];
    };

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

export default function DialerContractPage() {
  const [contract, setContract] = useState<DialerContract | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [readyPending, setReadyPending] = useState(false);
  const [readyResult, setReadyResult] = useState<ReadyResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);

      try {
        const response = await fetch("/api/dialer/contract", {
          method: "GET",
          cache: "no-store",
        });
        const body = (await response.json()) as DialerContract;

        if (!response.ok) {
          throw new Error(formatJson(body));
        }

        if (!cancelled) {
          setContract(body);
          const campaigns = extractCampaigns(body.raw_campaigns_response.json);
          if (campaigns.length === 1) {
            const onlyCampaignId = campaigns[0]?.campaign_id;
            if (typeof onlyCampaignId === "string") {
              setSelectedCampaign(onlyCampaignId);
            }
          }
        }
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "Failed to load dialer contract");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const softphonePayload =
    contract?.raw_softphone_response.json && typeof contract.raw_softphone_response.json === "object"
      ? (contract.raw_softphone_response.json as JsonRecord)
      : null;

  const campaignOptions = useMemo<CampaignOption[]>(() => {
    const campaigns = extractCampaigns(contract?.raw_campaigns_response.json);
    return campaigns
      .map((campaign) => {
        const campaignId = campaign.campaign_id;
        if (typeof campaignId !== "string" || !campaignId.trim()) {
          return null;
        }

        const name = typeof campaign.name === "string" && campaign.name.trim()
          ? campaign.name.trim()
          : campaignId;

        return {
          campaign_id: campaignId,
          label: name,
        };
      })
      .filter((campaign): campaign is CampaignOption => Boolean(campaign));
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

  async function goReady() {
    if (!contract || !readyEnabled) {
      return;
    }

    setReadyPending(true);
    setReadyResult(null);

    try {
      const response = await fetch("/api/dialer/agents/session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          agent_id: agentId,
          campaign_id: selectedCampaign,
          endpoint: contract.registration.endpoint,
          softphone: softphonePayload,
        }),
      });
      const text = await response.text();

      setReadyResult({
        ok: response.ok,
        status: response.status,
        text,
      });
    } catch (error) {
      setReadyResult({
        ok: false,
        status: 0,
        text: error instanceof Error ? error.message : "READY request failed",
      });
    } finally {
      setReadyPending(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 text-white">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <RadioTower className="h-5 w-5 text-blue-400" />
            <div>
              <h1 className="text-xl font-semibold">Real User Dialer Contract</h1>
              <p className="text-sm text-gray-400">This page renders only authenticated server truth.</p>
            </div>
          </div>
          <Badge className="bg-gray-800 text-gray-200">
            {contract?.checked_at ? new Date(contract.checked_at).toLocaleString() : "Loading"}
          </Badge>
        </div>

        {loading ? (
          <Card className="border-gray-700 bg-gray-900">
            <CardContent className="flex items-center gap-2 py-6 text-sm text-gray-300">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading authenticated dialer contract…
            </CardContent>
          </Card>
        ) : null}

        {loadError ? (
          <Card className="border-red-800 bg-red-950/40">
            <CardContent className="flex items-center gap-2 py-4 text-sm text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {loadError}
            </CardContent>
          </Card>
        ) : null}

        {contract ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Authenticated Identity</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-400">userId:</span> {contract.identity.userId || "null"}</div>
                  <div><span className="text-gray-400">orgId:</span> {contract.identity.orgId || "null"}</div>
                  <div><span className="text-gray-400">email:</span> {contract.identity.email || "null"}</div>
                  <div><span className="text-gray-400">displayName:</span> {contract.identity.displayName || "null"}</div>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Backend User Mapping</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-400">exact user/org row:</span>{" "}
                    {contract.backend_user_mapping.has_exact_user_org_row ? "yes" : "no"}
                  </div>
                  <div>
                    <span className="text-gray-400">endpoint metadata:</span>{" "}
                    {contract.backend_user_mapping.endpoint_metadata ? "present" : "missing"}
                  </div>
                  <pre className="max-h-48 overflow-auto rounded-md bg-gray-950 p-3 text-xs text-gray-200">
                    {formatJson(
                      contract.backend_user_mapping.exact_user_org_row ||
                        contract.backend_user_mapping.email_org_row,
                    )}
                  </pre>
                </CardContent>
              </Card>
            </div>

            {contract.diagnosis.active_org_required ? (
              <Card className="border-amber-800 bg-amber-950/30">
                <CardHeader>
                  <CardTitle className="text-base text-amber-100">Active Org Required</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-sm text-amber-50">
                  <p>
                    Clerk has a signed-in user, but no active organization is attached to this session. The dialer
                    API routes require both `userId` and `orgId`, so the real path stops here until an org is active.
                  </p>
                  <SignedIn>
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0">
                        <div className="mb-2 text-xs uppercase tracking-wide text-amber-300">Select existing org</div>
                        <OrganizationSwitcher
                          afterSelectOrganizationUrl="/dialer"
                          afterCreateOrganizationUrl="/dialer"
                          afterLeaveOrganizationUrl="/dialer"
                          hidePersonal
                        />
                      </div>
                      <div className="min-w-0">
                        <div className="mb-2 text-xs uppercase tracking-wide text-amber-300">Or create org</div>
                        <CreateOrganization afterCreateOrganizationUrl="/dialer" />
                      </div>
                    </div>
                  </SignedIn>
                </CardContent>
              </Card>
            ) : null}

            <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Dialer Ready Gate</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-2 text-sm">
                    <div><span className="text-gray-400">endpoint:</span> {contract.registration.endpoint || "null"}</div>
                    <div><span className="text-gray-400">registration:</span> {contract.registration.status || "null"}</div>
                    <div><span className="text-gray-400">source:</span> {contract.registration.source || "null"}</div>
                    <div><span className="text-gray-400">reason:</span> {contract.registration.reason || "null"}</div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm text-gray-300" htmlFor="campaign">
                      Campaign
                    </label>
                    <select
                      id="campaign"
                      value={selectedCampaign}
                      onChange={(event) => setSelectedCampaign(event.target.value)}
                      className="h-11 w-full rounded-md border border-gray-700 bg-gray-950 px-3 text-sm text-white outline-none focus:border-blue-500"
                    >
                      <option value="">Choose a campaign</option>
                      {campaignOptions.map((campaign) => (
                        <option key={campaign.campaign_id} value={campaign.campaign_id}>
                          {campaign.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    onClick={goReady}
                    disabled={!readyEnabled || readyPending}
                    className="h-11 w-full bg-green-600 font-semibold text-white hover:bg-green-500 disabled:bg-gray-700 disabled:text-gray-300"
                  >
                    {readyPending ? "Sending READY…" : "READY"}
                  </Button>

                  {readyResult ? (
                    <div
                      className={`rounded-md border p-3 text-sm ${
                        readyResult.ok
                          ? "border-green-800 bg-green-950/40 text-green-200"
                          : "border-red-800 bg-red-950/40 text-red-200"
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2 font-medium">
                        {readyResult.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                        READY response {readyResult.status}
                      </div>
                      <pre className="max-h-40 overflow-auto whitespace-pre-wrap break-words text-xs">
                        {readyResult.text}
                      </pre>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Campaign Access</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-400">org has campaigns:</span> {contract.campaign_access.org_has_campaigns ? "yes" : "no"}</div>
                  <div><span className="text-gray-400">org campaign count:</span> {contract.campaign_access.org_campaign_count}</div>
                  <div><span className="text-gray-400">user allowed to see campaigns:</span> {contract.campaign_access.user_allowed_to_see_campaigns ? "yes" : "no"}</div>
                  <div><span className="text-gray-400">rendered campaign count:</span> {contract.campaign_access.rendered_campaign_count}</div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Why Unauthorized</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div><span className="text-gray-400">flag:</span> {contract.diagnosis.unauthorized ? "yes" : "no"}</div>
                  <ul className="space-y-2 text-red-200">
                    {contract.diagnosis.unauthorized_reasons.length > 0 ? (
                      contract.diagnosis.unauthorized_reasons.map((reason) => (
                        <li key={reason} className="rounded-md border border-red-900 bg-red-950/40 px-3 py-2">
                          {reason}
                        </li>
                      ))
                    ) : (
                      <li className="rounded-md border border-green-900 bg-green-950/30 px-3 py-2 text-green-200">
                        The current request did not produce a 401.
                      </li>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Why Browser Softphone</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-yellow-100">
                  <div className="rounded-md border border-yellow-900 bg-yellow-950/40 px-3 py-3">
                    {contract.diagnosis.browser_softphone_reason}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="border-gray-700 bg-gray-900">
              <CardHeader>
                <CardTitle className="text-base text-gray-100">Next Step</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-200">
                <div className="rounded-md border border-blue-900 bg-blue-950/30 px-3 py-3">
                  {contract.diagnosis.suggested_next_step}
                </div>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Raw /api/dialer/campaigns</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-300">status: {contract.raw_campaigns_response.status}</div>
                  <pre className="max-h-[32rem] overflow-auto rounded-md bg-gray-950 p-3 text-xs text-gray-200">
                    {contract.raw_campaigns_response.text || formatJson(contract.raw_campaigns_response.json)}
                  </pre>
                </CardContent>
              </Card>

              <Card className="border-gray-700 bg-gray-900">
                <CardHeader>
                  <CardTitle className="text-base text-gray-100">Raw /api/dialer/agents/self/softphone</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="text-sm text-gray-300">status: {contract.raw_softphone_response.status}</div>
                  <pre className="max-h-[32rem] overflow-auto rounded-md bg-gray-950 p-3 text-xs text-gray-200">
                    {contract.raw_softphone_response.text || formatJson(contract.raw_softphone_response.json)}
                  </pre>
                </CardContent>
              </Card>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
