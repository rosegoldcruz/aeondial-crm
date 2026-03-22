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
const USER_ROLE = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ROLE) || "admin";

async function resolveIdentity() {
  const { userId, orgId, orgSlug } = await auth();
  if (!userId || !orgId) {
    return null;
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
  const fullName =
    [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") ||
    clerkUser?.username ||
    email;
  if (!email) {
    return null;
  }
  const displayName = fullName || email;

  return { userId, orgId, orgSlug: orgSlug || null, email, fullName: displayName };
}

async function proxy(request: Request, method: "GET" | "POST", path: string[]) {
  const identity = await resolveIdentity();
  if (!identity) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const incomingUrl = new URL(request.url);
  const query = incomingUrl.search || "";
  const target = `${BACKEND_URL}/dialer/${path.join("/")}${query}`;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      "x-org-id": identity.orgId,
      "x-org-slug": identity.orgSlug || identity.orgId,
      "x-role": USER_ROLE,
      "x-user-id": identity.userId,
      "x-user-email": identity.email,
      "x-user-name": identity.fullName,
    },
    cache: "no-store",
  };

  if (method === "POST") {
    const rawBody = await request.text();
    init.body = rawBody || "{}";
  }

  const res = await fetch(target, init);
  const text = await res.text();
  let body: unknown = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text || "Invalid backend response" };
  }

  return NextResponse.json(body, { status: res.status });
}

export async function GET(
  request: Request,
  context: { params: { path: string[] } },
) {
  return proxy(request, "GET", context.params.path);
}

export async function POST(
  request: Request,
  context: { params: { path: string[] } },
) {
  return proxy(request, "POST", context.params.path);
}
