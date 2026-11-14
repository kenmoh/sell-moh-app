import { getDb } from '..';
import type { SyncQueueItem, SyncMetadata } from '../types';

export class SyncQueueRepository {
  async getPending(limit: number = 100): Promise<SyncQueueItem[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<any>(
      'SELECT * FROM sync_queue WHERE status IN (?, ?) ORDER BY created_at ASC LIMIT ?',
      ['pending', 'failed'],
      limit
    );
    return rows.map(r => ({ ...r, payload: JSON.parse(r.payload) }));
  }

  async enqueue(item: Omit<SyncQueueItem, 'id' | 'created_at'>): Promise<SyncQueueItem> {
    const db = await getDb();
    const now = new Date().toISOString();
    const result = await db.runAsync(
      `INSERT INTO sync_queue (client_id, event_type, payload, client_ts, status, retry_count, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(client_id) DO UPDATE SET
         status = 'pending',
         retry_count = 0`,
      [item.client_id, item.event_type, JSON.stringify(item.payload), item.client_ts, item.status, item.retry_count, now]
    );
    return { ...item, id: result.insertId, created_at: now };
  }

  async enqueueBatch(items: Omit<SyncQueueItem, 'id' | 'created_at'>[]): Promise<number> {
    let count = 0;
    for (const item of items) {
      await this.enqueue(item);
      count++;
    }
    return count;
  }

  async markSyncing(clientIds: string[]): Promise<void> {
    const db = await getDb();
    if (clientIds.length === 0) return;
    const placeholders = clientIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE sync_queue SET status = 'syncing' WHERE client_id IN (${placeholders})`,
      clientIds
    );
  }

  async markSynced(clientIds: string[]): Promise<void> {
    const db = await getDb();
    if (clientIds.length === 0) return;
    const placeholders = clientIds.map(() => '?').join(',');
    await db.runAsync(
      `UPDATE sync_queue SET status = 'synced' WHERE client_id IN (${placeholders})`,
      clientIds
    );
  }

  async markFailed(clientId: string, error: string): Promise<void> {
    const db = await getDb();
    await db.runAsync(
      `UPDATE sync_queue SET status = 'failed', retry_count = retry_count + 1 WHERE client_id = ?`,
      [clientId]
    );
  }

  async getPendingCount(): Promise<number> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ c: number }>(
      "SELECT COUNT(*) as c FROM sync_queue WHERE status IN ('pending', 'failed')"
    );
    return row?.c ?? 0;
  }

  async cleanupSynced(olderThan: Date): Promise<number> {
    const db = await getDb();
    const result = await db.runAsync(
      "DELETE FROM sync_queue WHERE status = 'synced' AND created_at < ?",
      [olderThan.toISOString()]
    );
    return result.changes;
  }
}

export class SyncMetadataRepository {
  async get(key: string): Promise<string | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_metadata WHERE key = ?', [key]);
    return row?.value ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    const db = await getDb();
    const now = new Date().toISOString();
    await db.runAsync(
      `INSERT INTO sync_metadata (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = ?, updated_at = ?`,
      [key, value, now, value, now]
    );
  }

  async getAll(): Promise<SyncMetadata[]> {
    const db = await getDb();
    const rows = await db.getAllAsync<SyncMetadata>('SELECT * FROM sync_metadata');
    return rows;
  }
}

export const syncQueueRepo = new SyncQueueRepository();
export const syncMetadataRepo = new SyncMetadataRepository();
