// Legacy browser softphone removed – AEON uses ARI/PJSIP server-side registration
export interface SoftphoneConfig {
  org_id?: string | null;
  agent_id?: string;
  endpoint: string | null;
  sip_uri: string | null;
  authorization_username: string | null;
  password: string | null;
  ws_server: string | null;
  display_name?: string | null;
  registration_status?: "registered" | "unregistered" | "unknown" | null;
  registration_source?: "ari" | "none" | null;
  registration_reason?: string | null;
  metadata?: Record<string, unknown> | null;
}

export function useSoftphone(_config: SoftphoneConfig | null) {
  return {
    activeCall: false,
    audioRef: { current: null },
    error: null as string | null,
    isRegistered: false,
    status: "idle" as const,
  };
}

