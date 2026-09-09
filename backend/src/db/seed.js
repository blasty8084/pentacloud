import { query } from '../db/index.js';
import dotenv from 'dotenv';

dotenv.config();

async function seedB2Accounts() {
  for (let i = 1; i <= 5; i++) {
    const name = process.env[`B2_${i}_NAME`];
    const keyId = process.env[`B2_${i}_KEY_ID`];
    const appKey = process.env[`B2_${i}_APP_KEY`];
    const bucketName = process.env[`B2_${i}_BUCKET_NAME`];
    const bucketEndpoint = process.env[`B2_${i}_BUCKET_ENDPOINT`];
    const maxSizeGb = parseInt(process.env[`B2_${i}_MAX_SIZE_GB`] || '10', 10);

    if (name && keyId && appKey && bucketName && bucketEndpoint) {
      await query(`
        INSERT INTO b2_accounts (id, name, key_id, app_key, bucket_name, bucket_endpoint, max_size_gb)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)
        ON CONFLICT (key_id) DO UPDATE SET
          app_key = EXCLUDED.app_key,
          bucket_name = EXCLUDED.bucket_name,
          bucket_endpoint = EXCLUDED.bucket_endpoint,
          max_size_gb = EXCLUDED.max_size_gb
      `, [name, keyId, appKey, bucketName, bucketEndpoint, maxSizeGb]);
      console.log(`Upserted B2 account: ${name}`);
    }
  }

  console.log('B2 accounts seeded from environment');
}

seedB2Accounts().catch(console.error);