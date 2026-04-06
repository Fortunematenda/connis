const pool = require('../config/db');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add seq_id column if not exists
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS seq_id INTEGER`);

    // 2. Add unique constraint (company_id, seq_id)
    // Drop if exists first to be safe
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'users_company_seq_id_unique'
        ) THEN
          ALTER TABLE users ADD CONSTRAINT users_company_seq_id_unique UNIQUE (company_id, seq_id);
        END IF;
      END $$;
    `);

    // 3. Backfill existing users — assign seq_id per company ordered by created_at
    await client.query(`
      WITH numbered AS (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY company_id ORDER BY created_at ASC) AS rn
        FROM users
        WHERE seq_id IS NULL
      )
      UPDATE users SET seq_id = numbered.rn
      FROM numbered WHERE users.id = numbered.id
    `);

    await client.query('COMMIT');
    console.log('seq_id migration completed successfully');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Migration failed:', e.message);
  } finally {
    client.release();
    pool.end();
  }
}

migrate();
