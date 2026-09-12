import { query } from '../db/index.js';
import bcrypt from 'bcrypt';
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

export async function seedDefaultAdmin() {
  const adminEmail = process.env.DEFAULT_ADMIN_EMAIL;
  const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    console.warn('DEFAULT_ADMIN_EMAIL or DEFAULT_ADMIN_PASSWORD not set. Skipping default admin creation.');
    return;
  }

  try {
    const existingAdmin = await query('SELECT id FROM users WHERE email = $1', [adminEmail]);
    if (existingAdmin.rows.length > 0) {
      console.log(`Default admin already exists: ${adminEmail}`);
      return;
    }

    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
    await query(`
      INSERT INTO users (id, email, password_hash, name, role)
      VALUES (gen_random_uuid(), $1, $2, $3, 'admin')
      ON CONFLICT (email) DO NOTHING
    `, [adminEmail, passwordHash, 'Admin']);

    console.log(`Default admin created: ${adminEmail}`);
  } catch (err) {
    console.error('Failed to create default admin:', err.message);
  }
}

async function seed() {
  await seedB2Accounts();
  await seedDefaultAdmin();
}

export { seed, seedB2Accounts };