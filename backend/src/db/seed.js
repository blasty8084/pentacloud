import { resolve } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const dbPath = resolve(__dirname, '../../data/pentacloud.db');

// Detect runtime and use appropriate SQLite driver
const isBun = typeof Bun !== 'undefined';
let Database;
if (isBun) {
  // Use Bun's built-in sqlite
  const bunSqlite = await import('bun:sqlite');
  Database = bunSqlite.default;
} else {
  // Use better-sqlite3 for Node.js
  const betterSqlite3 = await import('better-sqlite3');
  Database = betterSqlite3.default;
}

const db = new Database(dbPath);

for (let i = 1; i <= 5; i++) {
  const name = process.env[`B2_${i}_NAME`];
  const keyId = process.env[`B2_${i}_KEY_ID`];
  const appKey = process.env[`B2_${i}_APP_KEY`];
  const bucketName = process.env[`B2_${i}_BUCKET_NAME`];
  const bucketEndpoint = process.env[`B2_${i}_BUCKET_ENDPOINT`];
  const maxSizeGb = parseInt(process.env[`B2_${i}_MAX_SIZE_GB`] || '10', 10);

  if (name && keyId && appKey && bucketName && bucketEndpoint) {
    const existing = db.prepare('SELECT id FROM b2_accounts WHERE name = ?').get(name);
    if (!existing) {
      const id = `b2-${i}-${Date.now()}`;
      db.prepare(
        `INSERT INTO b2_accounts (id, name, key_id, app_key, bucket_name, bucket_endpoint, max_size_gb)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      ).run(id, name, keyId, appKey, bucketName, bucketEndpoint, maxSizeGb);
      console.log(`Added B2 account: ${name}`);
    } else {
      console.log(`B2 account ${name} already exists`);
    }
  }
}

console.log('B2 accounts seeded from environment');