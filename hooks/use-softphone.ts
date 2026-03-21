"use client";

import { useEffect, useRef, useState } from "react";
import { Invitation, Registerer, SessionState, UserAgent, type RegistererState } from "sip.js";

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

type SoftphoneStatus = "idle" | "connecting" | "registered" | "error";

function attachRemoteAudio(session: Invitation | { sessionDescriptionHandler?: unknown }, audioEl: HTMLAudioElement | null) {
  const handler = (session as { sessionDescriptionHandler?: { peerConnection?: RTCPeerConnection } }).sessionDescriptionHandler;
  const peerConnection = handler?.peerConnection;
  if (!peerConnection || !audioEl) {
    return;
  }

  const stream = new MediaStream();
  for (const receiver of peerConnection.getReceivers()) {
    if (receiver.track) {
      stream.addTrack(receiver.track);
    }
  }

  audioEl.srcObject = stream;
  void audioEl.play().catch(() => undefined);
}

export function useSoftphone(config: SoftphoneConfig | null) {
  const [status, setStatus] = useState<SoftphoneStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [activeCall, setActiveCall] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const userAgentRef = useRef<UserAgent | null>(null);
  const registererRef = useRef<Registerer | null>(null);

  useEffect(() => {
    let disposed = false;

    async function start() {
      if (!config) {
        setStatus("idle");
        setError(null);
        return;
      }

      if (!config?.sip_uri || !config.authorization_username || !config.password || !config.ws_server) {
        setStatus("error");
        setError("Softphone config is incomplete");
        return;
      }

      setStatus("connecting");
      setError(null);

      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });

        const uri = UserAgent.makeURI(config.sip_uri);
        if (!uri) {
          throw new Error("Invalid SIP URI");
        }

        const userAgent = new UserAgent({
          uri,
          displayName: config.display_name || config.authorization_username,
          authorizationUsername: config.authorization_username,
          authorizationPassword: config.password,
          transportOptions: {
            server: config.ws_server,
          },
          delegate: {
            onInvite: (invitation) => {
              invitation.stateChange.addListener((state) => {
                if (disposed) return;
                if (state === SessionState.Established) {
                  setActiveCall(true);
                  attachRemoteAudio(invitation, audioRef.current);
                }
                if (state === SessionState.Terminated) {
                  setActiveCall(false);
                }
              });

              void invitation.accept({
                sessionDescriptionHandlerOptions: {
                  constraints: { audio: true, video: false },
                },
              }).catch((inviteError: unknown) => {
                if (disposed) return;
                setError(inviteError instanceof Error ? inviteError.message : "Failed to accept call");
                setStatus("error");
              });
            },
          },
        });

        userAgentRef.current = userAgent;
        await userAgent.start();

        const registerer = new Registerer(userAgent);
        registererRef.current = registerer;
        registerer.stateChange.addListener((state: RegistererState) => {
          if (disposed) return;
          if (String(state) === "Registered") {
            setStatus("registered");
            setError(null);
            return;
          }
          if (String(state) === "Unregistered") {
            setStatus("connecting");
          }
        });

        await registerer.register();
        if (!disposed) {
          setStatus("registered");
        }
      } catch (softphoneError) {
        if (disposed) return;
        setStatus("error");
        setError(softphoneError instanceof Error ? softphoneError.message : "Softphone failed to start");
      }
    }

    void start();

    return () => {
      disposed = true;
      const registerer = registererRef.current;
      const userAgent = userAgentRef.current;

      registererRef.current = null;
      userAgentRef.current = null;

      void (async () => {
        try {
          await registerer?.unregister();
        } catch {
          // Ignore shutdown errors.
        }

        try {
          await userAgent?.stop();
        } catch {
          // Ignore shutdown errors.
        }
      })();
    };
  }, [config]);

  return {
    activeCall,
    audioRef,
    error,
    isRegistered: status === "registered",
    status,
  };
}
