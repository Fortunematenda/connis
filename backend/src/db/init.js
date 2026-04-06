const fs = require('fs');
const path = require('path');
const pool = require('../config/db');

// Initialize database by running schema.sql
// Splits SQL into individual statements so ALTER TABLE migrations
// complete before CREATE INDEX references new columns
const initDB = async () => {
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');

    // Split on semicolons, filter out empty/comment-only blocks
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.match(/^[\s\-\/\*]*$/));

    for (const stmt of statements) {
      try {
        await pool.query(stmt);
      } catch (err) {
        // Ignore harmless errors (duplicate objects on re-run)
        if (err.code === '42710' || err.code === '42P07') continue; // already exists
        console.error(`[DB] Statement failed: ${stmt.substring(0, 80)}...`);
        throw err;
      }
    }

    console.log('[DB] Schema initialized successfully');
  } catch (err) {
    console.error('[DB] Schema initialization failed:', err.message);
    throw err;
  }
};

module.exports = initDB;
