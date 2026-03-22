import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function sanitizeEnv(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return value.replace(/^['"]|['"]$/g, "");
}

const BACKEND_URL =
  sanitizeEnv(process.env.AEONDIAL_BACKEND_URL) ||
  sanitizeEnv(process.env.BACKEND_URL) ||
  sanitizeEnv(process.env.NEXT_PUBLIC_AEONDIAL_BACKEND_URL) ||
  sanitizeEnv(process.env.NEXT_PUBLIC_BACKEND_URL) ||
  "http://localhost:4000";
const DEFAULT_ORG_ID =
  sanitizeEnv(process.env.NEXT_PUBLIC_ORG_ID) ||
  sanitizeEnv(process.env.ORG_ID) ||
  null;
const USER_ROLE = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ROLE) || "admin";

export async function GET(request: Request) {
  const { userId: clerkUserId, orgId: clerkOrgId, orgSlug: clerkOrgSlug } = await auth();
  const allowDevBypass =
    process.env.NODE_ENV !== "production" &&
    sanitizeEnv(process.env.ALLOW_DEV_DIALER_BYPASS) === "true";
  const devUserId = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ID) || sanitizeEnv(process.env.USER_ID) || null;
  const orgIdFromQuery = new URL(request.url).searchParams.get("org_id");
  const orgId =
    clerkOrgId ||
    (allowDevBypass ? orgIdFromQuery || DEFAULT_ORG_ID : null);
  const userId = clerkUserId || (allowDevBypass ? devUserId : null);
  if (!userId || !orgId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email =
    clerkUser?.emailAddresses?.[0]?.emailAddress ||
    (allowDevBypass ? sanitizeEnv(process.env.DEV_USER_EMAIL) || null : null);
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    email ||
    (allowDevBypass ? sanitizeEnv(process.env.DEV_USER_NAME) || null : null);
  if (!email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const displayName = fullName || email;
  const res = await fetch(`${BACKEND_URL}/campaigns?org_id=${encodeURIComponent(orgId)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": orgId,
      "x-org-slug": clerkOrgSlug || orgId,
      "x-role": USER_ROLE,
      "x-user-id": userId,
      "x-user-email": email,
      "x-user-name": displayName,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text || "Invalid backend response" };
  }

  return NextResponse.json(body, { status: res.status });
}
