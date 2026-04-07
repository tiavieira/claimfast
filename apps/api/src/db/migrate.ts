import fs from 'fs';
import path from 'path';
import { getDb } from './connection';

export function runMigrations(): void {
  const db = getDb();
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  db.exec(sql);

  // Additive column migrations (safe to re-run)
  for (const stmt of [
    "ALTER TABLE policies ADD COLUMN source TEXT DEFAULT 'imported'",
    "ALTER TABLE policies ADD COLUMN validation_status TEXT DEFAULT 'validated'",
    "ALTER TABLE users ADD COLUMN iban TEXT",
    "ALTER TABLE claims ADD COLUMN internal_notes TEXT DEFAULT '[]'",
    "CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, body TEXT NOT NULL, type TEXT NOT NULL DEFAULT 'info', read INTEGER DEFAULT 0, claim_id TEXT REFERENCES claims(id), created_at TEXT DEFAULT (datetime('now')))",
  ]) {
    try { db.exec(stmt); } catch { /* column already exists */ }
  }

  console.log('✅ Migrations applied');
}
