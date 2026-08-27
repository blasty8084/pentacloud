import { resolve } from 'path';
import { fileURLToPath } from 'url';
import Database from 'bun:sqlite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const dbPath = resolve(__dirname, '../../data/pentacloud.db');
const db = new Database(dbPath);

db.exec(`
  PRAGMA foreign_keys = ON;
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'user',
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS b2_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key_id TEXT NOT NULL,
    application_key TEXT NOT NULL,
    bucket_id TEXT NOT NULL,
    bucket_name TEXT NOT NULL,
    bucket_region TEXT,
    max_size_gb INTEGER DEFAULT 10,
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );

  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id TEXT,
    user_id TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS files (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    original_name TEXT NOT NULL,
    mime_type TEXT,
    size INTEGER NOT NULL,
    folder_id TEXT,
    user_id TEXT NOT NULL,
    b2_account_id TEXT NOT NULL,
    b2_file_id TEXT NOT NULL,
    b2_file_name TEXT NOT NULL,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    updated_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (b2_account_id) REFERENCES b2_accounts(id) ON DELETE RESTRICT
  );

  CREATE TABLE IF NOT EXISTS shares (
    id TEXT PRIMARY KEY,
    file_id TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at INTEGER,
    created_at INTEGER DEFAULT (strftime('%s', 'now')),
    FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
  CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);
  CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
  CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);
`);

console.log('Database initialized at', dbPath);

const b2Accounts = db.prepare('SELECT * FROM b2_accounts').all();
if (b2Accounts.length === 0) {
  console.log('No B2 accounts configured. Add them via environment variables or the settings page.');
}

export default db;