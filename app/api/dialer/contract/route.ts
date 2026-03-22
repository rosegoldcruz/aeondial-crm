import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

type JsonRecord = Record<string, unknown>;

interface RawRouteResponse {
  ok: boolean;
  status: number;
  text: string;
  json: unknown;
}

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

function normalizeEmail(value: string | null): string | null {
  return value ? value.trim().toLowerCase() : null;
}

function parseJson(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
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

async function fetchInternalRoute(request: Request, pathname: string): Promise<RawRouteResponse> {
  const url = new URL(pathname, request.url);
  const cookie = request.headers.get("cookie");
  const response = await fetch(url, {
    method: "GET",
    headers: cookie ? { cookie } : undefined,
    cache: "no-store",
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
    json: parseJson(text),
  };
}

async function fetchSupabaseRows(path: string): Promise<unknown[]> {
  const supabaseUrl = sanitizeEnv(process.env.SUPABASE_URL) || sanitizeEnv(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey =
    sanitizeEnv(process.env.SUPABASE_SERVICE_ROLE_KEY) || sanitizeEnv(process.env.SUPABASE_SECRET_KEY);

  if (!supabaseUrl || !serviceRoleKey) {
    return [];
  }

  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: "GET",
    headers: {
      apikey: serviceRoleKey,
      Authorization: `Bearer ${serviceRoleKey}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    return [];
  }

  const json = await response.json();
  return Array.isArray(json) ? json : [];
}

function firstObject(value: unknown[]): JsonRecord | null {
  const [first] = value;
  return first && typeof first === "object" ? (first as JsonRecord) : null;
}

function getEndpointMetadata(row: JsonRecord | null): JsonRecord | null {
  if (!row) return null;
  const metadata = row.metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const record = metadata as JsonRecord;
  const softphone = record.softphone;
  return softphone && typeof softphone === "object" ? (softphone as JsonRecord) : null;
}

function getPrimaryEmail(user: Awaited<ReturnType<typeof currentUser>>): string | null {
  return normalizeEmail(user?.emailAddresses?.[0]?.emailAddress || null);
}

function getDisplayName(user: Awaited<ReturnType<typeof currentUser>>, email: string | null): string | null {
  const fullName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
  if (fullName) return fullName;
  if (user?.username) return user.username;
  return email;
}

function getSoftphoneEndpoint(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as JsonRecord;
  const endpoint = record.endpoint;
  if (typeof endpoint === "string" && endpoint.trim()) return endpoint.trim();

  const metadata = record.metadata;
  if (!metadata || typeof metadata !== "object") return null;
  const nested = (metadata as JsonRecord).endpoint;
  return typeof nested === "string" && nested.trim() ? nested.trim() : null;
}

function getBrowserSoftphoneReason(raw: unknown, unauthorizedReasons: string[]): string {
  if (unauthorizedReasons.some((reason) => reason.includes("active orgId"))) {
    return "The signed-in Clerk session has no active org. The dialer proxy rejects requests until an org is selected, so any browser-softphone/default state is not trustworthy.";
  }

  if (raw && typeof raw === "object") {
    const record = raw as JsonRecord;
    if (record.code === "USER_ORG_CONFLICT") {
      return "The backend found this Clerk user under a different org than the active Clerk org. The dialer cannot trust endpoint metadata until the backend user/org mapping is corrected.";
    }

    if (record.code === "USER_BOOTSTRAP_FAILED" || record.code === "USER_ROW_MISSING") {
      return "The backend could not resolve a real users row for the active user and org. Any browser-softphone/default endpoint state would be synthetic rather than persisted system truth.";
    }
  }

  return "The old dialer page defaulted to 'Browser Softphone' whenever endpoint metadata was missing or browser SIP credentials were absent. It did this before proving a real endpoint or registration state.";
}

export async function GET(request: Request) {
  const { userId, orgId } = await auth();
  const clerkUser = await currentUser();
  const email = getPrimaryEmail(clerkUser);
  const displayName = getDisplayName(clerkUser, email);

  const [rawCampaignsResponse, rawSoftphoneResponse] = await Promise.all([
    fetchInternalRoute(request, "/api/dialer/campaigns"),
    fetchInternalRoute(request, "/api/dialer/agents/self/softphone"),
  ]);

  const backendUserRow = userId && orgId
    ? firstObject(
        await fetchSupabaseRows(
          `users?select=user_id,org_id,email,full_name,role,status,metadata&user_id=eq.${encodeURIComponent(userId)}&org_id=eq.${encodeURIComponent(orgId)}`,
        ),
      )
    : null;

  const backendEmailMatchRow = !backendUserRow && email && orgId
    ? firstObject(
        await fetchSupabaseRows(
          `users?select=user_id,org_id,email,full_name,role,status,metadata&email=eq.${encodeURIComponent(email)}&org_id=eq.${encodeURIComponent(orgId)}`,
        ),
      )
    : null;

  const orgCampaignRows = orgId
    ? await fetchSupabaseRows(
        `campaigns?select=campaign_id,name,status&org_id=eq.${encodeURIComponent(orgId)}&order=created_at.desc&limit=25`,
      )
    : [];

  const softphoneEndpoint = getSoftphoneEndpoint(rawSoftphoneResponse.json);
  const softphoneJson =
    rawSoftphoneResponse.json && typeof rawSoftphoneResponse.json === "object"
      ? (rawSoftphoneResponse.json as JsonRecord)
      : null;

  const unauthorizedReasons: string[] = [];
  if (!userId) unauthorizedReasons.push("Clerk auth() returned no userId.");
  if (!orgId) unauthorizedReasons.push("Clerk auth() returned no active orgId.");
  if (!email) unauthorizedReasons.push("Clerk currentUser() returned no primary email.");
  if (rawSoftphoneResponse.status === 401 && unauthorizedReasons.length === 0) {
    unauthorizedReasons.push("The softphone proxy returned 401 even though Clerk identity fields were present.");
  }
  if (rawCampaignsResponse.status === 401 && unauthorizedReasons.length === 0) {
    unauthorizedReasons.push("The campaigns proxy returned 401 even though Clerk identity fields were present.");
  }
  if (rawSoftphoneResponse.json && typeof rawSoftphoneResponse.json === "object") {
    const code = (rawSoftphoneResponse.json as JsonRecord).code;
    if (code === "USER_ORG_CONFLICT") {
      unauthorizedReasons.push("The backend user row for this Clerk user exists under a different org than the active Clerk org.");
    }
    if (code === "USER_BOOTSTRAP_FAILED") {
      unauthorizedReasons.push("The backend failed to create or resolve a users row for the active Clerk user and org.");
    }
    if (code === "USER_ROW_MISSING") {
      unauthorizedReasons.push("No backend users row exists for the active Clerk user and org.");
    }
  }

  const browserSoftphoneReason = getBrowserSoftphoneReason(rawSoftphoneResponse.json, unauthorizedReasons);

  return NextResponse.json(
    {
      checked_at: new Date().toISOString(),
      identity: {
        userId: userId || null,
        orgId: orgId || null,
        email,
        displayName,
      },
      backend_user_mapping: {
        exact_user_org_row: backendUserRow,
        email_org_row: backendEmailMatchRow,
        has_exact_user_org_row: Boolean(backendUserRow),
        endpoint_metadata: getEndpointMetadata(backendUserRow || backendEmailMatchRow),
      },
      raw_campaigns_response: rawCampaignsResponse,
      raw_softphone_response: rawSoftphoneResponse,
      registration: {
        endpoint: softphoneEndpoint,
        status:
          typeof softphoneJson?.registration_status === "string" ? softphoneJson.registration_status : null,
        source:
          typeof softphoneJson?.registration_source === "string" ? softphoneJson.registration_source : null,
        reason:
          typeof softphoneJson?.registration_reason === "string" ? softphoneJson.registration_reason : null,
      },
      campaign_access: {
        org_has_campaigns: orgCampaignRows.length > 0,
        org_campaign_count: orgCampaignRows.length,
        org_campaigns: orgCampaignRows,
        user_allowed_to_see_campaigns: rawCampaignsResponse.status < 400,
        rendered_campaign_count: extractCampaigns(rawCampaignsResponse.json).length,
      },
      diagnosis: {
        unauthorized: rawSoftphoneResponse.status === 401 || rawCampaignsResponse.status === 401,
        unauthorized_reasons: unauthorizedReasons,
        browser_softphone_reason: browserSoftphoneReason,
        active_org_required: !orgId,
        suggested_next_step: !orgId
          ? "Select or create an active Clerk organization, then reload the dialer contract."
          : "Use the raw responses below to resolve backend user mapping or endpoint registration issues.",
      },
    },
    { status: 200 },
  );
}
