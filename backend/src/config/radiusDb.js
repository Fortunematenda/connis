const { Pool } = require('pg');
require('dotenv').config();

const radiusPool = new Pool({
  host: process.env.RADIUS_DB_HOST || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.RADIUS_DB_PORT || process.env.DB_PORT || '5432', 10),
  user: process.env.RADIUS_DB_USER || process.env.DB_USER || 'postgres',
  password: process.env.RADIUS_DB_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.RADIUS_DB_NAME || 'radius',
  max: 5,
});

radiusPool.on('connect', () => {
  console.log('[RADIUS-DB] Connected to RADIUS PostgreSQL database');
});

radiusPool.on('error', (err) => {
  console.error('[RADIUS-DB] Connection error:', err.message);
});

module.exports = radiusPool;
