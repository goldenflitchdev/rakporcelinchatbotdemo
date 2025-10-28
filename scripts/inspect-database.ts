#!/usr/bin/env tsx
/**
 * Inspect RAK Porcelain Database Schema
 * Discovers tables, columns, and data structure
 */

import { query, testConnection, closePool } from '../lib/postgres';

async function inspectDatabase() {
  console.log('🔍 Inspecting RAK Porcelain Database...\n');

  // Test connection
  const connected = await testConnection();
  if (!connected) {
    console.error('Failed to connect to database. Check your credentials.');
    process.exit(1);
  }

  console.log('\n📊 Database Schema:\n');

  // Get all tables
  const tables = await query<{ tablename: string; schemaname: string }>(
    `SELECT tablename, schemaname 
     FROM pg_tables 
     WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
     ORDER BY tablename`
  );

  console.log(`Found ${tables.length} tables:\n`);

  for (const table of tables) {
    console.log(`\n📋 Table: ${table.schemaname}.${table.tablename}`);

    // Get column information
    const columns = await query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT column_name, data_type, is_nullable 
       FROM information_schema.columns 
       WHERE table_schema = $1 AND table_name = $2
       ORDER BY ordinal_position`,
      [table.schemaname, table.tablename]
    );

    console.log('   Columns:');
    columns.forEach(col => {
      console.log(`     - ${col.column_name} (${col.data_type}${col.is_nullable === 'NO' ? ', NOT NULL' : ''})`);
    });

    // Get row count
    const count = await query<{ count: string }>(
      `SELECT COUNT(*) as count FROM ${table.schemaname}.${table.tablename}`
    );
    console.log(`   Rows: ${count[0].count}`);

    // Sample first row
    const sample = await query(
      `SELECT * FROM ${table.schemaname}.${table.tablename} LIMIT 1`
    );
    if (sample.length > 0) {
      console.log('   Sample data keys:', Object.keys(sample[0]).join(', '));
    }
  }

  await closePool();
  console.log('\n✅ Database inspection complete!\n');
}

if (require.main === module) {
  inspectDatabase().catch(console.error);
}

export { inspectDatabase };

