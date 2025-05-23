CREATE TABLE IF NOT EXISTS platforms (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  logo  TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_accounts (
  id TEXT PRIMARY KEY,
  platform_id TEXT NOT NULL,
  name TEXT,
  remark TEXT,
  logo TEXT,
  state_data TEXT,
  login_status INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  lastest_login_time TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_account_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sequence TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_accounts_r_groups (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  token TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXIST video_publish_tasks (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  platform_id TEXT NOT NULL,
  data TEXT,
  status INTEGER DEFAULT 0,
  start_time TEXT,
  end_time TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);