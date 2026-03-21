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
const ORG_ID = sanitizeEnv(process.env.NEXT_PUBLIC_ORG_ID) || sanitizeEnv(process.env.ORG_ID) || "default-tenant";
const USER_ROLE = sanitizeEnv(process.env.NEXT_PUBLIC_USER_ROLE) || "admin";

export async function GET() {
  const { userId: clerkUserId } = await auth();
  const devUserId =
    sanitizeEnv(process.env.NEXT_PUBLIC_USER_ID) ||
    sanitizeEnv(process.env.USER_ID) ||
    "crm-user";
  const userId = clerkUserId || (process.env.NODE_ENV !== "production" ? devUserId : null);
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const clerkUser = await currentUser();
  const email = clerkUser?.emailAddresses?.[0]?.emailAddress || null;
  const fullName = [clerkUser?.firstName, clerkUser?.lastName].filter(Boolean).join(" ") || null;

  const res = await fetch(`${BACKEND_URL}/dialer/agents/self/softphone`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "x-org-id": ORG_ID,
      "x-role": USER_ROLE,
      "x-user-id": userId,
      "x-user-email": email || `${userId}@clerk.local`,
      "x-user-name": fullName || "Daniel Cruz",
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
