/**
 * Apply a single SQL migration file using DATABASE_URL from .env
 * Usage: node scripts/apply-migration.js supabase/migrations/20240129000000_order_quotes_bidding.sql
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');

async function main() {
  const rel = process.argv[2];
  if (!rel) {
    console.error('Usage: node scripts/apply-migration.js <migration.sql>');
    process.exit(1);
  }
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL missing in .env');
    process.exit(1);
  }

  const file = path.resolve(__dirname, '..', rel);
  const sql = fs.readFileSync(file, 'utf8');
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  await client.connect();
  try {
    await client.query(sql);
    console.log('✅ Applied', rel);
  } finally {
    await client.end();
  }
}

main().catch((err) => {
  console.error('❌', err.message);
  process.exit(1);
});
