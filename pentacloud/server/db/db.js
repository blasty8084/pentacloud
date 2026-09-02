// Database connection and query helpers using bun:sqlite
import Database from 'bun:sqlite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const dbPath = resolve(__dirname, '../../data/pentacloud.db');

// Ensure data directory exists
const dataDir = resolve(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const database = new Database(dbPath);
database.exec('PRAGMA foreign_keys = ON;');
database.exec('PRAGMA journal_mode = WAL;');

// Initialize schema
const schema = fs.readFileSync(resolve(__dirname, 'schema.sql'), 'utf8');
database.exec(schema);

console.log('Database initialized at', dbPath);

// Prepared statements for common queries
export const statements = {
  // Users
  createUser: database.prepare('INSERT INTO users (id, email, password_hash, name, role) VALUES (?, ?, ?, ?, ?)'),
  getUserByEmail: database.prepare('SELECT * FROM users WHERE email = ?'),
  getUserById: database.prepare('SELECT id, email, name, role FROM users WHERE id = ?'),
  getUserCount: database.prepare('SELECT COUNT(*) as count FROM users'),

  // Files
  createFile: database.prepare(`INSERT INTO files (id, name, original_name, mime_type, size, folder_id, user_id, b2_account_index, b2_file_id, b2_file_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`),
  getFileById: database.prepare('SELECT * FROM files WHERE id = ?'),
  getFilesByUser: database.prepare('SELECT * FROM files WHERE user_id = ? AND folder_id IS ? ORDER BY created_at DESC'),
  getFilesByUserAndFolder: database.prepare('SELECT * FROM files WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC'),
  searchFiles: database.prepare('SELECT * FROM files WHERE user_id = ? AND name LIKE ? ORDER BY created_at DESC'),
  updateFile: database.prepare('UPDATE files SET name = ?, folder_id = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  deleteFile: database.prepare('DELETE FROM files WHERE id = ? AND user_id = ?'),
  getFileForDownload: database.prepare('SELECT * FROM files WHERE id = ? AND user_id = ?'),

  // Folders
  createFolder: database.prepare('INSERT INTO folders (id, name, parent_id, user_id) VALUES (?, ?, ?, ?)'),
  getFolderById: database.prepare('SELECT * FROM folders WHERE id = ? AND user_id = ?'),
  getFoldersByUser: database.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name'),
  getRootFolders: database.prepare('SELECT * FROM folders WHERE user_id = ? AND parent_id IS NULL ORDER BY name'),
  getChildFolders: database.prepare('SELECT * FROM folders WHERE parent_id = ? AND user_id = ? ORDER BY name'),
  updateFolder: database.prepare('UPDATE folders SET name = ?, parent_id = ?, updated_at = ? WHERE id = ? AND user_id = ?'),
  deleteFolder: database.prepare('DELETE FROM folders WHERE id = ? AND user_id = ?'),
  getFolderTree: database.prepare('SELECT * FROM folders WHERE user_id = ? ORDER BY name'),

  // Shares
  createShare: database.prepare('INSERT INTO shares (id, file_id, token, expires_at) VALUES (?, ?, ?, ?)'),
  getShareByToken: database.prepare('SELECT * FROM shares WHERE token = ?'),
  deleteShare: database.prepare('DELETE FROM shares WHERE token = ?'),
  getSharesByFile: database.prepare('SELECT * FROM shares WHERE file_id = ?'),

  // Stats
  getFileCountByAccount: database.prepare('SELECT b2_account_index, COUNT(*) as count, SUM(size) as total_size FROM files GROUP BY b2_account_index'),
};

export const db = database;
export default database;