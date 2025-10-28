#!/usr/bin/env tsx
import { query } from '../lib/postgres';

async function checkSchema() {
  const cols = await query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'products' AND table_schema = 'public' 
    ORDER BY ordinal_position
  `);
  
  console.log('Products table columns:');
  cols.forEach((c: any) => console.log('  -', c.column_name, '(' + c.data_type + ')'));
  
  // Get sample record
  const sample = await query('SELECT * FROM products LIMIT 1');
  if (sample.length > 0) {
    console.log('\nSample data keys:', Object.keys(sample[0]).join(', '));
  }
}

checkSchema().catch(console.error).finally(() => process.exit(0));

