import { fetchTenantStores, type StoreData } from "@/api/store";
import { useSession } from "@/lib/ctx";
import { useStorageState } from "@/lib/useStorageState";
import { useQuery } from "@tanstack/react-query";
import {
  use,
  createContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

export interface ActiveStoreValue {
  isOwner: boolean;
  stores: StoreData[];
  storesLoading: boolean;
  /** The globally selected store. null = All Stores. Non-owners are locked to their own store. */
  activeStoreId: string | null;
  /** Display name of the active store, or "All Stores". */
  activeStoreName: string;
  /**
   * For store-bound screens (POS, inventory) that cannot operate without a
   * concrete store: the active store, falling back to the first store when
   * the global selection is "All Stores". Never writes back to the global
   * selection.
   */
  resolvedStoreId: string;
  resolvedStoreName: string;
  /** Persist the global selection. Pass null for All Stores. */
  setStore: (storeId: string | null) => void;
  sheetVisible: boolean;
  setSheetVisible: (visible: boolean) => void;
}

const ActiveStoreContext = createContext<ActiveStoreValue | null>(null);

export function useActiveStore(): ActiveStoreValue {
  const value = use(ActiveStoreContext);
  if (!value) {
    throw new Error("useActiveStore must be wrapped in <ActiveStoreProvider />");
  }
  return value;
}

export function ActiveStoreProvider({ children }: PropsWithChildren) {
  const { user, session, isLoading: sessionLoading } = useSession();
  const isOwner = user?.role?.toLowerCase() === "owner";
  const [[, storedStoreId], setStoredStoreId] = useStorageState("activeStoreId");
  const [sheetVisible, setSheetVisible] = useState(false);

  const { data: storesData, isLoading: storesLoading } = useQuery({
    queryKey: ["stores"],
    queryFn: fetchTenantStores,
    enabled: !!session,
    staleTime: 60_000,
  });
  const stores = storesData ?? [];

  // Multi-account hygiene: drop the previous user's selection on sign-out.
  // Guard on sessionLoading — session is briefly null while storage loads,
  // which must not wipe a persisted selection on cold start.
  useEffect(() => {
    if (!sessionLoading && !session) {
      setStoredStoreId(null);
    }
  }, [sessionLoading, session, setStoredStoreId]);

  const value = useMemo<ActiveStoreValue>(() => {
    const activeStoreId: string | null = isOwner
      ? storedStoreId || null
      : user?.store_id || null;
    const activeStoreName =
      stores.find((s) => s.id === activeStoreId)?.name ?? "All Stores";
    const resolvedStoreId = activeStoreId ?? stores[0]?.id ?? "";
    const resolvedStoreName =
      stores.find((s) => s.id === resolvedStoreId)?.name ?? "All Stores";

    return {
      isOwner,
      stores,
      storesLoading,
      activeStoreId,
      activeStoreName,
      resolvedStoreId,
      resolvedStoreName,
      setStore: setStoredStoreId,
      sheetVisible,
      setSheetVisible,
    };
  }, [
    isOwner,
    storedStoreId,
    user?.store_id,
    stores,
    storesLoading,
    setStoredStoreId,
    sheetVisible,
  ]);

  return (
    <ActiveStoreContext.Provider value={value}>
      {children}
    </ActiveStoreContext.Provider>
  );
}
