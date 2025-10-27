import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = path.join(process.cwd(), 'data', 'analytics.db');

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (db) {
    return db;
  }

  // Ensure data directory exists
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  db = new Database(DB_PATH);

  // Create analytics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      page TEXT,
      query TEXT,
      latency_ms INTEGER,
      retrieved_docs INTEGER,
      model TEXT,
      tokens_used INTEGER,
      success BOOLEAN
    );

    CREATE INDEX IF NOT EXISTS idx_timestamp ON analytics(timestamp);
    CREATE INDEX IF NOT EXISTS idx_page ON analytics(page);
  `);

  return db;
}

export interface AnalyticsEvent {
  page: string;
  query: string;
  latencyMs: number;
  retrievedDocs: number;
  model: string;
  tokensUsed: number;
  success: boolean;
}

export function logAnalyticsEvent(event: AnalyticsEvent): void {
  try {
    const database = getDatabase();
    const stmt = database.prepare(`
      INSERT INTO analytics (page, query, latency_ms, retrieved_docs, model, tokens_used, success)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      event.page,
      event.query,
      event.latencyMs,
      event.retrievedDocs,
      event.model,
      event.tokensUsed,
      event.success ? 1 : 0
    );
  } catch (error) {
    console.error('Failed to log analytics event:', error);
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}


