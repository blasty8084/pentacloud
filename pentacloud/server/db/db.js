// Database connection and query helpers
const Database = require('better-sqlite3');
const { resolve } = require('path');
const { fileURLToPath } = require('url');
const fs = require('fs');

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const dbPath = resolve(__dirname, '../../data/pentacloud.db');

// Ensure data directory exists
const dataDir = resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Initialize schema
const schema = fs.readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
db.exec(schema);

console.log('Database initialized at', dbPath);

// Prepared statements for common queries
const statements = {
  // Users
  createUser: db.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'),
  getUserByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: db.prepare('SELECT id, email, name, role FROM users WHERE id = ?'),
  getUserCount: db.prepare('SELECT COUNT(*) as count FROM users'),

  // Files
  createFile: db.prepare(`INSERT INTO files (id, name, original_name, mime_type, size, folder_id, user_id, b2_account_index, b2_file_id, b2_file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getFileById: db.prepare('SELECT * FROM files WHERE id = ?'),
  getFilesByUser: db.prepare('SELECT * FROM files WHERE user_id = ? AND folder_id IS ? ORDER BY created_at DESC'),
  getFilesByUserAndFolder: db.prepare('SELECT * FROM files WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC'),
  searchFiles: db.prepare('SELECT * FROM files WHERE user_id = ? AND name LIKE ? ORDER BY created_at DESC'),
  updateFile: db.prepare('UPDATE files SET name = ?, folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  deleteFile: db.prepare('DELETE FROM files WHERE id = ? AND user_id = ?'),
  getFileForDownload: db.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?'),

  // Folders
  createFolder: db.prepare('INSERT INTO folders (id, name, parent_id, user_id) VALUES (?, ?, ?, ?)'),
  getFolderById: db.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?'),
  getFoldersByUser: db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name'),
  getRootFolders: db.prepare('SELECT * FROM folders WHERE user_id = ? AND parent_id IS NULL ORDER BY name'),
  getChildFolders: db.prepare('SELECT * FROM folders WHERE parent_id = ? AND user_id = ? ORDER BY name'),
  updateFolder: db.prepare('UPDATE folders SET name = ?, parent_id = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  deleteFolder: db.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?'),
  getFolderTree: db.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name'),

  // Shares
  createShare: db.prepare('INSERT INTO shares (id, file_id, token, expires_at) VALUES (?, ?, ?, ?)'),
  getShareByToken: db.prepare('SELECT * FROM shares WHERE token = ?'),
  deleteShare: db.prepare('DELETE FROM shares WHERE token = ?'),
  getSharesByFile: db.prepare('SELECT * FROM shares WHERE file_id = ?'),

  // Stats
  getFileCountByAccount: db.prepare('SELECT b2_account_index, COUNT(*) as count, SUM(size) as total_size FROM files GROUP BY b2_account_index'),
};

module.exports = { db, statements };