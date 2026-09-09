import { query } from '../db/index.js';

export async function initializeDatabase() {
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

  // B2 Accounts table
  await query(`
    CREATE TABLE IF NOT EXISTS b2_accounts (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      key_id VARCHAR(255) NOT NULL,
      app_key TEXT NOT NULL,
      bucket_name VARCHAR(255) NOT NULL,
      bucket_endpoint VARCHAR(255) NOT NULL,
      max_size_gb INTEGER DEFAULT 10,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

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

  // Shares table
  await query(`
    CREATE TABLE IF NOT EXISTS shares (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
      token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
      expires_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;

  // Indexes
  await query('CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_files_user ON files(user_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);');
  await query('CREATE INDEX IF NOT EXISTS idx_shares_token ON shares(token);');

  console.log('Database initialized (PostgreSQL)');
}

export async function getDb() {
  // This is a placeholder - actual db pool is in ../db/index.js
  return null;
}