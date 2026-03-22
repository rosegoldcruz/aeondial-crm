import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

function normalizeEmail(value: string | null): string | null {
  return value ? value.trim().toLowerCase() : null;
}

export async function GET() {
  const { userId, orgId, sessionId, orgRole, orgSlug } = await auth();
  const clerkUser = await currentUser();
  const email = normalizeEmail(clerkUser?.emailAddresses?.[0]?.emailAddress || null);

  return NextResponse.json(
    {
      checked_at: new Date().toISOString(),
      auth: {
        userId: userId || null,
        orgId: orgId || null,
        sessionId: sessionId || null,
        orgRole: orgRole || null,
        orgSlug: orgSlug || null,
      },
      user: {
        email,
      },
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}