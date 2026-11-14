/**
 * Offline database types shared across repositories and sync engine.
 */

export type EntityType =
  | 'stores'
  | 'store_products'
  | 'products'
  | 'categories'
  | 'sales'
  | 'sale_items'
  | 'stock_balances'
  | 'customers';

export interface LocalEntity {
  id: string;
  entity_type: EntityType;
  data: Record<string, any>;
  version: number;
  created_at: string;
  updated_at: string;
  deleted: boolean;
}

export interface SyncQueueItem {
  id?: number;
  client_id: string;
  event_type: string;
  payload: Record<string, any>;
  client_ts: string;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  retry_count: number;
  created_at: string;
}

export interface SyncMetadata {
  key: string;
  value: string;
  updated_at: string;
}

export interface SyncEvent {
  event_type: string;
  payload: Record<string, any>;
  client_id?: string;
  client_ts?: string;
}

export interface SyncSnapshotResult {
  entities: Array<{
    entity_type: string;
    id: string;
    data: Record<string, any>;
    version: number;
    updated_at: string | null;
  }>;
  cursor: string;
  total: number;
}

export interface FullSyncResult {
  processed: number;
  failed: number;
  errors: Array<Record<string, any>>;
  server_events: Array<{
    event_type: string;
    payload: Record<string, any>;
    client_id?: string;
    client_ts?: string;
  }>;
  cursor: string;
}
