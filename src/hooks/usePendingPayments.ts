import { getPendingPayments } from "@/api/payments";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { useEventStream } from "./use-event-stream";

/**
 * How often to fall back to polling when the event stream is not connected.
 *
 * Only reached if the stream fails or the session had no token yet. 60s is the
 * safety net, not the normal path — the previous behaviour polled every 10s
 * from every device indefinitely, which is 6 requests a minute per till to
 * render one number.
 */
const FALLBACK_POLL_MS = 60_000;

/** Events that mean the pending set may have changed. */
const PAYMENT_EVENTS = new Set(["payment.pending", "payment.updated"]);

export function usePendingPayments(enabled = true) {
  const queryClient = useQueryClient();

  const onEvent = useCallback(
    (event: { event: string }) => {
      if (!PAYMENT_EVENTS.has(event.event)) return;
      // The stream carries a nudge, not data, so the row is refetched. It is
      // also how this device learns about a payment started at another till,
      // which is exactly what the old ten-second poll existed to catch.
      void queryClient.invalidateQueries({ queryKey: ["pending-payments"] });
    },
    [queryClient],
  );

  const status = useEventStream(onEvent, enabled);
  const streaming = status === "open";

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: getPendingPayments,
    enabled,
    // While the stream is up there is no reason to poll at all. When it is not,
    // fall back so the badge still moves.
    refetchInterval: streaming ? false : FALLBACK_POLL_MS,
    // A fresh window should not sit on a stale list.
    refetchOnWindowFocus: true,
    staleTime: 15_000,
  });

  return {
    pendingPayments: data ?? [],
    count: data?.length ?? 0,
    isLoading,
    refetch,
    /** Exposed so a screen can explain why the count might lag. */
    streamStatus: status,
  };
}