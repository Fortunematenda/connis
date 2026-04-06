const { Pool } = require('pg');
require('dotenv').config();

// PostgreSQL connection pool — reuses connections for performance
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,               // Maximum number of connections in the pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Test the connection on startup
pool.on('connect', () => {
  console.log('[DB] Connected to PostgreSQL');
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err);
  process.exit(-1);
});

module.exports = pool;
