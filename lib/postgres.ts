/**
 * PostgreSQL Database Connection
 * Connects to RAK Porcelain staging database
 */

import { Pool, PoolClient } from 'pg';

let pool: Pool | null = null;

export interface DBConfig {
  host: string;
  user: string;
  password: string;
  port: number;
  database: string;
}

export function getDBConfig(): DBConfig {
  return {
    host: process.env.DB_HOST || '',
    user: process.env.DB_USER || '',
    password: process.env.DB_PWD || '',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_DATABASE || '',
  };
}

export function getPool(): Pool {
  if (pool) {
    return pool;
  }

  const config = getDBConfig();
  
  pool = new Pool({
    host: config.host,
    user: config.user,
    password: config.password,
    port: config.port,
    database: config.database,
    ssl: {
      rejectUnauthorized: false, // For AWS RDS
    },
    max: 10, // Maximum number of clients
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  pool.on('error', (err) => {
    console.error('Unexpected database error:', err);
  });

  return pool;
}

export async function query<T = any>(
  text: string,
  params?: any[]
): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows;
}

export async function getClient(): Promise<PoolClient> {
  const pool = getPool();
  return await pool.connect();
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Test connection
export async function testConnection(): Promise<boolean> {
  try {
    const pool = getPool();
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

