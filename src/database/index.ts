import * as SQLite from 'expo-sqlite';
import { Platform } from 'react-native';

const DB_NAME = 'sellmoh_offline.db';

let dbInstance: SQLite.SQLiteDatabase | null = null;

export async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (dbInstance) return dbInstance;

  // Open the database (creates if not exists)
  dbInstance = await SQLite.openDatabaseAsync(DB_NAME);
  await ensureSchema(dbInstance);
  return dbInstance;
}

export async function ensureSchema(db: SQLite.SQLiteDatabase): Promise<void> {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS entities (
      id TEXT PRIMARY KEY,
      entity_type TEXT NOT NULL,
      data TEXT NOT NULL,
      version INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_entities_type ON entities(entity_type);
    CREATE INDEX IF NOT EXISTS idx_entities_updated ON entities(updated_at);

    CREATE TABLE IF NOT EXISTS sync_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id TEXT NOT NULL UNIQUE,
      event_type TEXT NOT NULL,
      payload TEXT NOT NULL,
      client_ts TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      retry_count INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sync_queue_status ON sync_queue(status);

    CREATE TABLE IF NOT EXISTS sync_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_carts (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      store_id TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      coupon_code TEXT,
      discount_amount REAL DEFAULT 0,
      status TEXT DEFAULT 'open',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS local_cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cart_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      price REAL NOT NULL,
      qty REAL NOT NULL DEFAULT 1,
      extra REAL NOT NULL DEFAULT 0,
      item_id TEXT,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_local_cart_items_cart ON local_cart_items(cart_id);
  `);
}

export async function resetDb(): Promise<void> {
  if (dbInstance) {
    await dbInstance.closeAsync();
    dbInstance = null;
  }
  await SQLite.deleteDatabaseAsync(DB_NAME);
  dbInstance = null;
  await getDb();
}
