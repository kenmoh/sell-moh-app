import { useQuery } from "@tanstack/react-query";
import { getPendingPayments } from "@/api/payments";

export function usePendingPayments(enabled = true) {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["pending-payments"],
    queryFn: getPendingPayments,
    enabled,
    refetchInterval: 10_000,
  });

  return {
    pendingPayments: data ?? [],
    count: data?.length ?? 0,
    isLoading,
    refetch,
  };
}
