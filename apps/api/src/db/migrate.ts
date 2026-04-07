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
  ]) {
    try { db.exec(stmt); } catch { /* column already exists */ }
  }

  console.log('✅ Migrations applied');
}
