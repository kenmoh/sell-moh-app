import { useCallback, useEffect, useState } from 'react';
import {
  getPendingCount,
  hasInitialSync,
  incrementalSync,
  initialSync,
  isOnline,
  isSyncing,
  onSyncChange,
  queueEvent,
  startBackgroundSync,
  stopBackgroundSync,
} from '../sync/engine';

export interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  hasInitialSync: boolean;
}

export function useSyncStatus() {
  const [status, setStatus] = useState<SyncStatus>({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    hasInitialSync: false,
  });

  const refresh = useCallback(async () => {
    const [online, pending, initial] = await Promise.all([
      isOnline(),
      getPendingCount(),
      hasInitialSync(),
    ]);
    setStatus({
      isOnline: online,
      isSyncing: isSyncing(),
      pendingCount: pending,
      hasInitialSync: initial,
    });
  }, []);

  useEffect(() => {
    refresh();
    const unsub = onSyncChange(refresh);
    return unsub;
  }, [refresh]);

  return status;
}

export function useSync() {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    if (!isRunning) {
      startBackgroundSync(30000);
      setIsRunning(true);
    }
    return () => {
      stopBackgroundSync();
    };
  }, []);

  const doInitialSync = useCallback(async () => {
    await initialSync();
  }, []);

  const doIncrementalSync = useCallback(async () => {
    await incrementalSync();
  }, []);

  const queue = useCallback(async (eventType: string, payload: Record<string, any>) => {
    await queueEvent(eventType, payload);
  }, []);

  return { doInitialSync, doIncrementalSync, queue };
}
