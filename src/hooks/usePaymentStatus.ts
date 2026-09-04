import { useEffect, useRef, useState, useCallback } from "react";
import { getPaymentStatus } from "@/api/payments";
import { PaymentStatusResponse } from "@/types/payments";

export function usePaymentStatus(saleId: string | null, enabled = true) {
  const [data, setData] = useState<PaymentStatusResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const mountedRef = useRef(true);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);

  const poll = useCallback(async () => {
    if (!saleId || !mountedRef.current) return;
    try {
      const status = await getPaymentStatus(saleId);
      if (!mountedRef.current) return;
      setData(status);
      setError(null);
      if (status.status === "completed" || status.status === "failed") {
        stopPolling();
      }
    } catch (err: any) {
      if (!mountedRef.current) return;
      setError(err?.message || "Failed to check payment status");
    }
  }, [saleId, stopPolling]);

  const startPolling = useCallback(
    (intervalMs = 5000) => {
      if (!saleId || !enabled) return;
      stopPolling();
      setIsPolling(true);
      poll();
      intervalRef.current = setInterval(poll, intervalMs);
    },
    [saleId, enabled, poll, stopPolling],
  );

  useEffect(() => {
    mountedRef.current = true;
    if (saleId && enabled) {
      startPolling();
    }
    return () => {
      mountedRef.current = false;
      stopPolling();
    };
  }, [saleId, enabled, startPolling, stopPolling]);

  return { data, error, isPolling, startPolling, stopPolling };
}
