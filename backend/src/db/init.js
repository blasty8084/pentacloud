import { query } from '../db/index.js';

// Helper for logging bytes in human-readable format
function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function initializeDatabase() {
  // Users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name VARCHAR(255),
      role VARCHAR(50) DEFAULT 'user',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Migrations for users table (idempotent)
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS name VARCHAR(255);`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'user';`);

  // B2 Accounts table
  await query(`
    CREATE TABLE IF NOT EXISTS b2_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      key_id VARCHAR(255) NOT NULL UNIQUE,
      app_key TEXT NOT NULL,
      bucket_name VARCHAR(255) NOT NULL,
      bucket_endpoint VARCHAR(255) NOT NULL,
      max_size_gb INTEGER DEFAULT 10,
      used_bytes BIGINT DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Migrations for b2_accounts table (idempotent)
  await query(`ALTER TABLE b2_accounts ADD COLUMN IF NOT EXISTS used_bytes BIGINT DEFAULT 0;`);
  await query(`ALTER TABLE b2_accounts ADD COLUMN IF NOT EXISTS bucket_endpoint VARCHAR(255);`);

  // Folders table
  await query(`
    CREATE TABLE IF NOT EXISTS folders (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      parent_id UUID REFERENCES folders(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Migrations for folders table (idempotent)
  await query(`ALTER TABLE folders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);

  // Files table
  await query(`
    CREATE TABLE IF NOT EXISTS files (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      original_name VARCHAR(255) NOT NULL,
      mime_type VARCHAR(255),
      size BIGINT NOT NULL,
      folder_id UUID REFERENCES folders(id) ON DELETE SET NULL,
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      b2_account_id UUID NOT NULL REFERENCES b2_accounts(id) ON DELETE RESTRICT,
      b2_file_id VARCHAR(255) NOT NULL,
      b2_file_name VARCHAR(255) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Migrations for files table (idempotent)
  await query(`ALTER TABLE files ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();`);

  // Shares table
  await query(`
    CREATE TABLE IF NOT EXISTS shares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Indexes
  await query('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);');

  // Defensive check: validate used_bytes doesn't exceed max_size_gb * 1073741824
  // Wrapped in try/catch so a diagnostic can never crash startup
  try {
    const checkResult = await query(`
      SELECT id, name, used_bytes, max_size_gb, (max_size_gb::bigint * 1073741824) as max_bytes
      FROM b2_accounts 
      WHERE used_bytes > (max_size_gb::bigint * 1073741824)
    `);
    
    if (checkResult.rows.length > 0) {
      console.warn('⚠️  STORAGE INCONSISTENCY DETECTED: The following accounts have used_bytes exceeding their max capacity:');
      for (const row of checkResult.rows) {
        const overage = row.used_bytes - row.max_bytes;
        const overageGB = (overage / 1073741824).toFixed(2);
        console.warn(`  - Account "${row.name}" (${row.id}): used=${formatBytes(row.used_bytes)}, max=${formatBytes(row.max_bytes)}, OVER by ${overageGB} GB`);
      }
      console.warn('   This indicates a bug in space accounting. Run the reconcile endpoint to fix.');
    }
  } catch (err) {
    console.warn('⚠️  Defensive storage check failed (non-fatal):', err.message);
  }

  console.log('Database initialized (PostgreSQL)');
}

export async function getDb() {
  return null;
}

export { initializeDatabase };
export default initializeDatabase;
