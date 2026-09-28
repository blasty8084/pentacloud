import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Parse BIGINT (OID 20) as JavaScript numbers instead of strings
// Values fit well within Number.MAX_SAFE_INTEGER (9e15)
pg.types.setTypeParser(20, (val) => parseInt(val, 10));

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export const query = async (text, params) => {
  const client = await pool.connect();
  try {
    const result = await client.query(text, params);
    return result;
  } finally {
    client.release();
  }
};

export const getClient = async () => {
  return await pool.connect();
};

export default {
  query,
  getClient,
};