import { getDb } from '..';
import type { EntityType, LocalEntity } from '../types';

export class EntityRepository {
  async getAll(type?: EntityType): Promise<LocalEntity[]> {
    const db = await getDb();
    let rows;
    if (type) {
      rows = await db.getAllAsync<any>('SELECT * FROM entities WHERE entity_type = ? AND deleted = 0 ORDER BY updated_at DESC', [type]);
    } else {
      rows = await db.getAllAsync<any>('SELECT * FROM entities WHERE deleted = 0 ORDER BY updated_at DESC');
    }
    return rows.map(r => ({ ...r, data: JSON.parse(r.data), deleted: !!r.deleted }));
  }

  async getById(type: EntityType, id: string): Promise<LocalEntity | null> {
    const db = await getDb();
    const row = await db.getFirstAsync<any>('SELECT * FROM entities WHERE entity_type = ? AND id = ? AND deleted = 0', [type, id]);
    if (!row) return null;
    return { ...row, data: JSON.parse(row.data), deleted: !!row.deleted };
  }

  async upsert(entity: Omit<LocalEntity, 'version' | 'created_at' | 'updated_at'> & { version?: number }): Promise<LocalEntity> {
    const db = await getDb();
    const now = new Date().toISOString();
    const existing = await this.getById(entity.entity_type, entity.id);
    const version = (existing?.version ?? 0) + 1;

    await db.runAsync(
      `INSERT INTO entities (id, entity_type, data, version, created_at, updated_at, deleted)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         entity_type = excluded.entity_type,
         data = excluded.data,
         version = excluded.version,
         updated_at = excluded.updated_at,
         deleted = excluded.deleted`,
      [
        entity.id,
        entity.entity_type,
        JSON.stringify(entity.data),
        version,
        existing?.created_at ?? now,
        now,
        entity.deleted ? 1 : 0,
      ]
    );

    return {
      id: entity.id,
      entity_type: entity.entity_type,
      data: entity.data,
      version,
      created_at: existing?.created_at ?? now,
      updated_at: now,
      deleted: entity.deleted,
    };
  }

  async softDelete(type: EntityType, id: string): Promise<boolean> {
    const existing = await this.getById(type, id);
    if (!existing) return false;
    await this.upsert({ id, entity_type: type, data: existing.data, deleted: true });
    return true;
  }

  async bulkUpsert(entities: Array<{ entity_type: EntityType; id: string; data: Record<string, any>; version: number; updated_at: string | null }>): Promise<number> {
    const db = await getDb();
    const now = new Date().toISOString();
    let count = 0;

    for (const e of entities) {
      await db.runAsync(
        `INSERT INTO entities (id, entity_type, data, version, created_at, updated_at, deleted)
         VALUES (?, ?, ?, ?, ?, ?, 0)
         ON CONFLICT(id) DO UPDATE SET
           entity_type = excluded.entity_type,
           data = excluded.data,
           version = excluded.version,
           updated_at = excluded.updated_at`,
        [e.id, e.entity_type, JSON.stringify(e.data), e.version, now, e.updated_at ?? now]
      );
      count++;
    }
    return count;
  }

  async count(type?: EntityType): Promise<number> {
    const db = await getDb();
    if (type) {
      const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM entities WHERE entity_type = ? AND deleted = 0', [type]);
      return row?.c ?? 0;
    }
    const row = await db.getFirstAsync<{ c: number }>('SELECT COUNT(*) as c FROM entities WHERE deleted = 0');
    return row?.c ?? 0;
  }
}

export const entityRepo = new EntityRepository();
