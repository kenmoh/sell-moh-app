import { eventStream, type StreamEvent, type StreamStatus } from "@/lib/event-stream";
import { useSession } from "@/lib/ctx";
import { useEffect, useRef, useState } from "react";

/**
 * Subscribe to the tenant's live event stream.
 *
 * The connection is shared across the app (see lib/event-stream), so mounting
 * this in several components still costs one socket. Returns the connection
 * status so a caller can fall back to polling while the stream is down —
 * events are a latency optimisation, not a correctness dependency: the server
 * only sends a nudge and the client still refetches.
 */
export function useEventStream(
  onEvent: (event: StreamEvent) => void,
  enabled = true,
): StreamStatus {
  const { getTokens } = useSession();
  const [status, setStatus] = useState<StreamStatus>("idle");

  // Held in a ref so a caller passing an inline closure does not resubscribe
  // on every render.
  const handler = useRef(onEvent);
  useEffect(() => {
    handler.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const unsubscribe = eventStream.subscribe(
      (event) => {
        if (!cancelled) handler.current(event);
      },
      (next) => {
        if (!cancelled) setStatus(next);
      },
    );

    // The stream is bearer-authenticated, so it cannot connect before a
    // session exists.
    void getTokens().then((tokens) => {
      if (!cancelled) eventStream.setToken(tokens?.accessToken ?? null);
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [enabled, getTokens]);

  // Keep the credential fresh across sign-in and token refresh.
  useEffect(() => {
    if (!enabled) return;
    void getTokens().then((tokens) => eventStream.setToken(tokens?.accessToken ?? null));
  }, [enabled, getTokens]);

  return status;
}