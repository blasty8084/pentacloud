import { resolve } from 'path';
import { fileURLToPath } from 'url';
import Database from 'bun:sqlite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

const dbPath = resolve(__dirname, '../../data/pentacloud.db');
const db = new Database(dbPath);

for (let i = 1; i <= 5; i++) {
  const name = process.env[`B2_${i}_NAME`];
  const keyId = process.env[`B2_${i}_KEY_ID`];
  const applicationKey = process.env[`B2_${i}_APPLICATION_KEY`];
  const bucketId = process.env[`B2_${i}_BUCKET_ID`];
  const bucketName = process.env[`B2_${i}_BUCKET_NAME`];
  const bucketRegion = process.env[`B2_${i}_BUCKET_REGION`];
  const maxSizeGb = parseInt(process.env[`B2_${i}_MAX_SIZE_GB`] || '10', 10);

  if (name && keyId && applicationKey && bucketId && bucketName) {
    const existing = db.prepare('SELECT id FROM b2_accounts WHERE name = ?').get(name);
    if (!existing) {
      const id = `b2-${i}-${Date.now()}`;
      db.prepare(
        `INSERT INTO b2_accounts (id, name, key_id, application_key, bucket_id, bucket_name, bucket_region, max_size_gb)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      ).run(id, name, keyId, applicationKey, bucketId, bucketName, bucketRegion || '', maxSizeGb);
      console.log(`Added B2 account: ${name}`);
    } else {
      console.log(`B2 account ${name} already exists`);
    }
  }
}

console.log('B2 accounts seeded from environment');