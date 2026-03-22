"use client";

import { useEffect, useState } from "react";
import { useAuth, useClerk } from "@clerk/nextjs";
import { AlertCircle, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface AuthContextResponse {
  checked_at: string;
  auth: {
    userId: string | null;
    orgId: string | null;
    sessionId: string | null;
    orgRole: string | null;
    orgSlug: string | null;
  };
  user: {
    email: string | null;
  };
}

function getRedirectUrl(value: string | null): string {
  if (!value || !value.startsWith("/")) {
    return "/dialer";
  }

  return value;
}

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function OrgSyncPage() {
  const router = useRouter();
  const { orgId: clientOrgId, userId } = useAuth();
  const { setActive } = useClerk();
  const [serverState, setServerState] = useState<AuthContextResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [redirectUrl, setRedirectUrl] = useState("/dialer");
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    setRedirectUrl(getRedirectUrl(params.get("redirect_url")));
    setSelectedOrgId(params.get("selected_org_id"));
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      setError(null);

      try {
        if (selectedOrgId && userId && !clientOrgId) {
          await setActive({ organization: selectedOrgId });
        }

        for (let attempt = 0; attempt < 8; attempt += 1) {
          const response = await fetch("/api/dialer/auth-context", {
            method: "GET",
            cache: "no-store",
          });
          const body = (await response.json()) as AuthContextResponse;

          if (cancelled) {
            return;
          }

          setServerState(body);

          if (body.auth.orgId) {
            router.replace(redirectUrl);
            router.refresh();
            return;
          }

          await wait(350);
        }

        if (!cancelled) {
          setError("Selected organization did not reach Clerk auth() on the server.");
        }
      } catch (syncError) {
        if (!cancelled) {
          setError(syncError instanceof Error ? syncError.message : "Organization sync failed.");
        }
      }
    }

    void sync();

    return () => {
      cancelled = true;
    };
  }, [clientOrgId, redirectUrl, router, selectedOrgId, setActive, userId]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 text-white">
      <div className="w-full max-w-xl rounded-2xl border border-neutral-800 bg-neutral-900/95 p-6 shadow-[0_0_40px_rgba(0,0,0,0.35)]">
        <div className="mb-4 flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-orange-400" />
          <div>
            <h1 className="text-lg font-semibold">Syncing active organization</h1>
            <p className="text-sm text-neutral-400">Waiting for Clerk auth() on the server to reflect the selected org.</p>
          </div>
        </div>

        <div className="space-y-2 rounded-xl border border-neutral-800 bg-neutral-950/80 p-4 text-sm text-neutral-200">
          <div><span className="text-neutral-500">client orgId:</span> {clientOrgId || "null"}</div>
          <div><span className="text-neutral-500">server orgId:</span> {serverState?.auth.orgId || "null"}</div>
          <div><span className="text-neutral-500">server userId:</span> {serverState?.auth.userId || "null"}</div>
          <div><span className="text-neutral-500">checked_at:</span> {serverState?.checked_at || "pending"}</div>
        </div>

        {error ? (
          <div className="mt-4 rounded-xl border border-amber-700 bg-amber-950/40 p-4 text-sm text-amber-100">
            <div className="mb-2 flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Active org did not propagate to the server session.
            </div>
            <div>{error}</div>
          </div>
        ) : null}
      </div>
    </div>
  );
}