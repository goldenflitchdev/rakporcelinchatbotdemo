#!/usr/bin/env tsx
import { query, closePool } from '../lib/postgres';

async function main() {
  try {
    const rows = await query<{ count: string }>(`SELECT COUNT(*)::bigint::text AS count FROM products`);
    const total = rows[0]?.count || '0';
    console.log(total);
  } catch (err) {
    console.error('Error:', err instanceof Error ? err.message : String(err));
    process.exit(1);
  } finally {
    await closePool();
  }
}

main();


