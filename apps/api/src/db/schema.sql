PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT,
  nif TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS policies (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  insurer TEXT NOT NULL,
  policy_number TEXT UNIQUE NOT NULL,
  holder_name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  premium_monthly REAL,
  status TEXT DEFAULT 'active',
  plate TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_year INTEGER,
  address TEXT,
  coverages TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claims (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  policy_id TEXT NOT NULL REFERENCES policies(id),
  type TEXT NOT NULL,
  status TEXT DEFAULT 'submitted',
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_date TEXT NOT NULL,
  incident_location TEXT,
  ai_analysis TEXT,
  is_covered INTEGER DEFAULT 1,
  coverage_reason TEXT,
  estimated_amount REAL,
  approved_amount REAL,
  expert_name TEXT,
  expert_phone TEXT,
  photos TEXT DEFAULT '[]',
  fraud_score INTEGER DEFAULT 0,
  fraud_factors TEXT DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claim_events (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(id),
  status TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS claim_messages (
  id TEXT PRIMARY KEY,
  claim_id TEXT NOT NULL REFERENCES claims(id),
  role TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
