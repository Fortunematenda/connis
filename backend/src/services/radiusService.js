const radiusDb = require('../config/radiusDb');

// ══════════════════════════════════════════════════════════════
// RADIUS Database Service
// Manages users in the FreeRADIUS PostgreSQL tables
// Tables: radcheck, radreply, radusergroup, radgroupreply, nas
// ══════════════════════════════════════════════════════════════

// ── User Provisioning ─────────────────────────────────────────

/**
 * Create a RADIUS user with password and optional rate limit
 * @param {string} username - PPPoE username
 * @param {string} password - Cleartext password
 * @param {string} groupname - Plan/group name (e.g. "pppoe-10M")
 * @param {object} [options] - Optional attributes
 * @param {string} [options.rateLimit] - Mikrotik-Rate-Limit (e.g. "5M/10M")
 * @param {string} [options.ipAddress] - Framed-IP-Address
 */
const createUser = async (username, password, groupname, options = {}) => {
  const client = await radiusDb.connect();
  try {
    await client.query('BEGIN');

    // 1. Set Cleartext-Password in radcheck
    await client.query(
      `INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, 'Cleartext-Password', ':=', $2)`,
      [username, password]
    );

    // 2. Set per-user Mikrotik-Rate-Limit in radreply if provided
    if (options.rateLimit) {
      await client.query(
        `INSERT INTO radreply (username, attribute, op, value) VALUES ($1, 'Mikrotik-Rate-Limit', ':=', $2)`,
        [username, options.rateLimit]
      );
    }

    // 3. Set Framed-IP-Address if provided
    if (options.ipAddress) {
      await client.query(
        `INSERT INTO radreply (username, attribute, op, value) VALUES ($1, 'Framed-IP-Address', ':=', $2)`,
        [username, options.ipAddress]
      );
    }

    // 4. Assign user to group (plan)
    if (groupname) {
      await client.query(
        `INSERT INTO radusergroup (username, groupname, priority) VALUES ($1, $2, 1)`,
        [username, groupname]
      );
    }

    await client.query('COMMIT');
    console.log(`[RADIUS] User created: ${username} (group: ${groupname})`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Remove a RADIUS user completely (all tables)
 */
const deleteUser = async (username) => {
  const client = await radiusDb.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM radcheck WHERE username = $1', [username]);
    await client.query('DELETE FROM radreply WHERE username = $1', [username]);
    await client.query('DELETE FROM radusergroup WHERE username = $1', [username]);
    await client.query('COMMIT');
    console.log(`[RADIUS] User deleted: ${username}`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Update a RADIUS user's password
 */
const updatePassword = async (username, newPassword) => {
  const result = await radiusDb.query(
    `UPDATE radcheck SET value = $1 WHERE username = $2 AND attribute = 'Cleartext-Password'`,
    [newPassword, username]
  );
  if (result.rowCount === 0) {
    // User doesn't exist in radcheck — create entry
    await radiusDb.query(
      `INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, 'Cleartext-Password', ':=', $2)`,
      [username, newPassword]
    );
  }
  console.log(`[RADIUS] Password updated: ${username}`);
  return true;
};

/**
 * Rename a RADIUS user (change username)
 */
const renameUser = async (oldUsername, newUsername) => {
  const client = await radiusDb.connect();
  try {
    await client.query('BEGIN');
    // Update username in all tables
    await client.query(`UPDATE radcheck SET username = $1 WHERE username = $2`, [newUsername, oldUsername]);
    await client.query(`UPDATE radreply SET username = $1 WHERE username = $2`, [newUsername, oldUsername]);
    await client.query(`UPDATE radusergroup SET username = $1 WHERE username = $2`, [newUsername, oldUsername]);
    await client.query('COMMIT');
    console.log(`[RADIUS] Username changed: ${oldUsername} → ${newUsername}`);
    return true;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Update a RADIUS user's rate limit (Mikrotik-Rate-Limit)
 */
const updateRateLimit = async (username, rateLimit) => {
  const result = await radiusDb.query(
    `UPDATE radreply SET value = $1 WHERE username = $2 AND attribute = 'Mikrotik-Rate-Limit'`,
    [rateLimit, username]
  );
  if (result.rowCount === 0) {
    await radiusDb.query(
      `INSERT INTO radreply (username, attribute, op, value) VALUES ($1, 'Mikrotik-Rate-Limit', ':=', $2)`,
      [username, rateLimit]
    );
  }
  console.log(`[RADIUS] Rate limit updated: ${username} → ${rateLimit}`);
  return true;
};

/**
 * Change a user's group (plan)
 */
const changeGroup = async (username, newGroupname) => {
  const result = await radiusDb.query(
    `UPDATE radusergroup SET groupname = $1 WHERE username = $2`,
    [newGroupname, username]
  );
  if (result.rowCount === 0) {
    await radiusDb.query(
      `INSERT INTO radusergroup (username, groupname, priority) VALUES ($1, $2, 1)`,
      [username, newGroupname]
    );
  }
  console.log(`[RADIUS] Group changed: ${username} → ${newGroupname}`);
  return true;
};

/**
 * Disable a RADIUS user by adding Auth-Type := Reject
 */
const disableUser = async (username) => {
  // Remove any existing Auth-Type entries
  await radiusDb.query(
    `DELETE FROM radcheck WHERE username = $1 AND attribute = 'Auth-Type'`,
    [username]
  );
  // Add Auth-Type := Reject to block authentication
  await radiusDb.query(
    `INSERT INTO radcheck (username, attribute, op, value) VALUES ($1, 'Auth-Type', ':=', 'Reject')`,
    [username]
  );
  console.log(`[RADIUS] User disabled: ${username}`);
  return true;
};

/**
 * Enable a RADIUS user by removing Auth-Type := Reject
 */
const enableUser = async (username) => {
  await radiusDb.query(
    `DELETE FROM radcheck WHERE username = $1 AND attribute = 'Auth-Type'`,
    [username]
  );
  console.log(`[RADIUS] User enabled: ${username}`);
  return true;
};

/**
 * Check if a user exists in RADIUS
 */
const userExists = async (username) => {
  const result = await radiusDb.query(
    `SELECT id FROM radcheck WHERE username = $1 LIMIT 1`,
    [username]
  );
  return result.rows.length > 0;
};

/**
 * Get a user's RADIUS attributes
 */
const getUser = async (username) => {
  const check = await radiusDb.query('SELECT * FROM radcheck WHERE username = $1', [username]);
  const reply = await radiusDb.query('SELECT * FROM radreply WHERE username = $1', [username]);
  const group = await radiusDb.query('SELECT * FROM radusergroup WHERE username = $1', [username]);
  return {
    username,
    check: check.rows,
    reply: reply.rows,
    groups: group.rows,
  };
};

// ── Group (Plan) Management ──────────────────────────────────

/**
 * Create or update a RADIUS group with rate limit
 * Used to set plan-level attributes (all users in this group get the rate limit)
 */
const upsertGroup = async (groupname, rateLimit) => {
  // Remove old rate limit for this group
  await radiusDb.query(
    `DELETE FROM radgroupreply WHERE groupname = $1 AND attribute = 'Mikrotik-Rate-Limit'`,
    [groupname]
  );
  // Insert new rate limit
  if (rateLimit) {
    await radiusDb.query(
      `INSERT INTO radgroupreply (groupname, attribute, op, value) VALUES ($1, 'Mikrotik-Rate-Limit', ':=', $2)`,
      [groupname, rateLimit]
    );
  }
  console.log(`[RADIUS] Group updated: ${groupname} → rate-limit: ${rateLimit}`);
  return true;
};

// ── NAS (Router) Management ──────────────────────────────────

/**
 * Register a NAS (MikroTik router) in the RADIUS server
 */
const upsertNas = async (nasname, secret, shortname, description) => {
  const existing = await radiusDb.query('SELECT id FROM nas WHERE nasname = $1', [nasname]);
  if (existing.rows.length > 0) {
    await radiusDb.query(
      `UPDATE nas SET secret = $1, shortname = $2, description = $3 WHERE nasname = $4`,
      [secret, shortname, description, nasname]
    );
  } else {
    await radiusDb.query(
      `INSERT INTO nas (nasname, shortname, type, secret, description) VALUES ($1, $2, 'other', $3, $4)`,
      [nasname, shortname, secret, description]
    );
  }
  console.log(`[RADIUS] NAS registered: ${nasname} (${shortname})`);
  return true;
};

module.exports = {
  createUser,
  deleteUser,
  updatePassword,
  renameUser,
  updateRateLimit,
  changeGroup,
  disableUser,
  enableUser,
  userExists,
  getUser,
  upsertGroup,
  upsertNas,
};
