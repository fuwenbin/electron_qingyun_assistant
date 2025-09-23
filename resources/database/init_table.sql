/*
status: 0-未激活 1-已激活
*/
CREATE TABLE IF NOT EXISTS platforms (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  logo  TEXT,
  login_url TEXT,
  publish_video_url TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

/*
login_status: 0-未登录 1-已登录
status: 0-未激活 1-已激活
*/
CREATE TABLE IF NOT EXISTS platform_accounts (
  id TEXT PRIMARY KEY,
  platform_id INTEGER NOT NULL,
  platform_account_id TEXT NOT NULL,
  name TEXT,
  remark TEXT,
  logo TEXT,
  state_data TEXT,
  login_status INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  last_login_time TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_account_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sequence INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS platform_accounts_r_groups (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  sequence INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

/*
frequency: minutes, hours, time
status: 0-待执行 1-执行中 2-完成
*/
CREATE TABLE IF NOT EXISTS video_publish_settings  (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  title TEXT,
  description TEXT,
  topic_group1 TEXT,
  topic_group2 TEXT,
  platform_data TEXT,
  frequency TEXT DEFAULT 'minutes',
  frequency_value INTEGER DEFAULT 5,
  daily_time TEXT,
  status INTEGER DEFAULT 0,
  task_ids TEXT DEFAULT '',
  account_ids TEXT DEFAULT '',
  platform_id INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

/*
status: 0:未开始 1:进行中 2:成功 3:失败
publish_type: 0:立即发布 1:平台定时固定时间发布 2：本地定时固定时间发布 3：本地定时固定间隔发布
*/
CREATE TABLE IF NOT EXISTS video_publish_tasks (
  id TEXT PRIMARY KEY,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  title TEXT DEFAULT '',
  description TEXT DEFAULT '',
  topic TEXT DEFAULT '',
  platform_data TEXT DEFAULT '',
  account_id TEXT NOT NULL,
  platform_id INTEGER NOT NULL,
  publish_type INTEGER NOT NULL DEFAULT 0,
  publish_time TEXT DEFAULT '',
  scheduled_start_time TEXT DEFAULT '',
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',
  status INTEGER DEFAULT 0,
  item_id TEXT DEFAULT '',
  collect_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  digg_count INTEGER DEFAULT 0,
  forward_count INTEGER DEFAULT 0,
  live_watch_count INTEGER DEFAULT 0,
  play_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

/*
sync_status: 1-成功 2-失败
*/
CREATE TABLE IF NOT EXISTS account_sync_records (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL,
  sync_status INTEGER NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);