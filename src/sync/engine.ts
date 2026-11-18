import NetInfo from '@react-native-community/netinfo';
import { apiClient, BASE_URL } from '../api/client';
import { getDb } from '../database';
import { entityRepo } from '../database/repositories/entity.repo';
import { syncQueueRepo, syncMetadataRepo } from '../database/repositories/sync.repo';
import type { EntityType, SyncEvent, SyncSnapshotResult, FullSyncResult } from '../database/types';

const DEVICE_ID_KEY = 'device_id';
const LAST_CURSOR_KEY = 'last_cursor';
const LAST_SYNC_KEY = 'last_sync_at';
const IS_INITIAL_SYNCED_KEY = 'is_initial_synced';

let _deviceId: string | null = null;
let _isSyncing = false;
let _isOnline = true;
let _netInfoSub: (() => void) | null = null;
const _listeners: Set<() => void> = new Set();

async function getDeviceId(): Promise<string> {
  if (_deviceId) return _deviceId;
  _deviceId = await syncMetadataRepo.get(DEVICE_ID_KEY);
  if (!_deviceId) {
    _deviceId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await syncMetadataRepo.set(DEVICE_ID_KEY, _deviceId);
  }
  return _deviceId;
}

function notifyListeners() {
  for (const fn of _listeners) fn();
}

export function onSyncChange(listener: () => void): () => void {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

export async function isOnline(): Promise<boolean> {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
}

export async function getPendingCount(): Promise<number> {
  return syncQueueRepo.getPendingCount();
}

export function isSyncing(): boolean {
  return _isSyncing;
}

export async function hasInitialSync(): Promise<boolean> {
  const val = await syncMetadataRepo.get(IS_INITIAL_SYNCED_KEY);
  return val === 'true';
}

/** Download the full data snapshot from the server and replace local data. */
export async function initialSync(force = false): Promise<void> {
  if (!force && (await hasInitialSync())) return;
  _isSyncing = true;
  notifyListeners();
  try {
    const response = await apiClient.get<SyncSnapshotResult>('/sync/snapshot');
    if (!response.ok) throw new Error('Snapshot failed');
    const { entities, cursor } = response.data || { entities: [], cursor: '' };
    await entityRepo.bulkUpsert(entities as any);
    await syncMetadataRepo.set(IS_INITIAL_SYNCED_KEY, 'true');
    const now = new Date().toISOString();
    await syncMetadataRepo.set(LAST_SYNC_KEY, now);
    if (cursor) await syncMetadataRepo.set(LAST_CURSOR_KEY, cursor);
    else await syncMetadataRepo.set(LAST_CURSOR_KEY, now);
  } finally {
    _isSyncing = false;
    notifyListeners();
  }
}

/** Push pending events and pull server events in one call. */
export async function incrementalSync(): Promise<void> {
  if (_isSyncing) return;
  const online = await isOnline();
  if (!online) return;

  _isSyncing = true;
  notifyListeners();
  try {
    const deviceId = await getDeviceId();
    const lastCursor = await syncMetadataRepo.get(LAST_CURSOR_KEY);

    // Get pending events from local queue
    const pending = await syncQueueRepo.getPending(100);
    const events: SyncEvent[] = pending.map(p => ({
      event_type: p.event_type,
      payload: p.payload,
      client_id: p.client_id,
      client_ts: p.client_ts,
    }));

    // Mark as syncing
    const clientIds = events.map(e => e.client_id!).filter(Boolean);
    if (clientIds.length > 0) {
      await syncQueueRepo.markSyncing(clientIds);
    }

    // Call full sync endpoint
    const response = await apiClient.post<FullSyncResult>('/sync/full', {
      events,
      last_cursor: lastCursor || undefined,
      device_id: deviceId,
    });

    if (!response.ok) throw new Error('Full sync failed');
    const result = response.data;

    // Mark successfully processed events as synced
    if (result?.applied && result.applied.length > 0) {
      await syncQueueRepo.markSynced(
        result.applied
          .map((item) => item.client_id)
          .filter(Boolean) as string[],
      );
    }

    // Duplicates already applied earlier are safe to mark synced.
    if (result?.duplicates && result.duplicates.length > 0) {
      await syncQueueRepo.markSynced(
        result.duplicates
          .map((dup) => dup.client_id)
          .filter(Boolean) as string[],
      );
    }

    // Mark failed events
    if (result?.errors && result.errors.length > 0) {
      for (const fail of result.errors) {
        const clientId = fail.client_id;
        if (clientId) await syncQueueRepo.markFailed(clientId, String(fail.error));
      }
    }

    // Apply server events to local entities
    if (result?.server_events) {
      for (const sev of result.server_events) {
        await applyServerEvent(sev);
      }
    }

    // Update cursor
    if (result?.cursor) {
      await syncMetadataRepo.set(LAST_CURSOR_KEY, result.cursor);
    }

    const now = new Date().toISOString();
    await syncMetadataRepo.set(LAST_SYNC_KEY, now);

    // Update server cursor
    try {
      await apiClient.put('/sync/cursor', {
        device_id: deviceId,
        last_cursor: result?.cursor || now,
      });
    } catch {
      // Non-critical
    }

    // Cleanup old synced items (older than 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    await syncQueueRepo.cleanupSynced(sevenDaysAgo);
  } catch (error) {
    console.error('[Sync] incrementalSync failed:', error);
  } finally {
    _isSyncing = false;
    notifyListeners();
  }
}

/** Apply a locally captured offline sale to the entity store and stock. */
async function applySaleCreatedLocally(payload: Record<string, any>): Promise<void> {
  const saleId = payload.offline_sale_id || payload.id || payload.client_id;
  if (!saleId) return;

  await entityRepo.upsert({
    id: String(saleId),
    entity_type: 'sales' as EntityType,
    data: {
      ...payload,
      status: 'completed',
      amount_paid: payload.total ?? 0,
      payment_methods: { cash: payload.total ?? 0 },
    },
    deleted: false,
  });

  const storeId = payload.store_id;
  const items = Array.isArray(payload.items) ? payload.items : [];
  const db = await getDb();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM entities WHERE entity_type = ? AND deleted = 0',
    ['stock_balances']
  );
  for (const row of rows) {
    const data = row.data ?? {};
    if (data.product_id === null || data.store_id === null) continue;
    const item = items.find((i: any) => String(i.product_id) === String(data.product_id));
    if (!item || !storeId || String(data.store_id) !== String(storeId)) continue;
    const newQty = Number(data.qty ?? 0) - Number(item.qty ?? 0);
    await entityRepo.upsert({
      id: row.id,
      entity_type: 'stock_balances' as EntityType,
      data: { ...data, qty: newQty },
      deleted: false,
    });
  }
}

/** Apply a server event to the local entity store. */
async function applyServerEvent(event: { event_type: string; payload: Record<string, any> }): Promise<void> {
  const parts = event.event_type.split('.');
  if (parts.length < 2) return;

  const entityType = parts[0] as any;
  const action = parts[1];
  const id = event.payload.id;
  if (!id) return;

  if (entityType === 'sales' && (action === 'created' || action === 'updated')) {
    await applySaleCreatedLocally(event.payload);
    return;
  }

  if (action === 'created' || action === 'updated') {
    await entityRepo.upsert({
      id: String(id),
      entity_type: entityType,
      data: event.payload,
      deleted: false,
    });
  } else if (action === 'deleted' || action === 'voided') {
    await entityRepo.softDelete(entityType, String(id));
  }
}

/** Queue a local change for later sync. */
export async function queueEvent(eventType: string, payload: Record<string, any>): Promise<void> {
  const clientId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const now = new Date().toISOString();
  await syncQueueRepo.enqueue({
    client_id: clientId,
    event_type: eventType,
    payload,
    client_ts: now,
    status: 'pending',
    retry_count: 0,
  });

  // Apply locally immediately
  if (eventType === 'sale.created') {
    await applySaleCreatedLocally(payload);
  } else {
    await applyServerEvent({ event_type: eventType, payload });
  }
  notifyListeners();
}

/** Start background sync — checks connectivity and syncs periodically. */
export async function startBackgroundSync(intervalMs: number = 30000): Promise<void> {
  // Check connectivity changes
  const sub = await NetInfo.addEventListener(state => {
    _isOnline = state.isConnected ?? false;
    if (_isOnline) {
      incrementalSync();
    }
  });
  _netInfoSub = sub;

  // Periodic sync
  const interval = setInterval(async () => {
    const online = await isOnline();
    if (online) {
      incrementalSync();
    }
  }, intervalMs);

  // Store interval ID and listener for cleanup
  (globalThis as any).__syncInterval = interval;
}

export function stopBackgroundSync(): void {
  const iv = (globalThis as any).__syncInterval;
  if (iv) clearInterval(iv);
  if (_netInfoSub) {
    _netInfoSub();
    _netInfoSub = null;
  }
}
