const pool = require('../config/db');
const { getRouterConfigForCompany } = require('./routerResolver');
const { getStrategy } = require('./authStrategy');

// Daily deduction for prepaid users — deducts (plan price / 30) per day
const runDailyDeductions = async () => {
  console.log('[BILLING] Running daily prepaid deductions...');
  try {
    // Find all active prepaid user_plans with user balances
    const result = await pool.query(`
      SELECT u.id AS user_id, u.username, u.company_id, u.balance,
             p.price, p.name AS plan_name
      FROM users u
      JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
      JOIN plans p ON up.plan_id = p.id
      WHERE u.active = TRUE AND p.billing_type = 'prepaid'
    `);

    let deducted = 0;
    let suspended = 0;

    for (const row of result.rows) {
      const dailyCost = parseFloat(row.price) / 30;
      if (dailyCost <= 0) continue;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        // Deduct daily cost
        await client.query(
          'UPDATE users SET balance = balance - $1, updated_at = NOW() WHERE id = $2',
          [dailyCost.toFixed(2), row.user_id]
        );

        // Record transaction
        await client.query(
          `INSERT INTO transactions (company_id, user_id, amount, type, description)
           VALUES ($1, $2, $3, 'debit', $4)`,
          [row.company_id, row.user_id, dailyCost.toFixed(2), `Daily charge: ${row.plan_name}`]
        );

        await client.query('COMMIT');
        deducted++;

        // Check if balance is now <= 0 — suspend user
        const balRes = await pool.query('SELECT balance FROM users WHERE id = $1', [row.user_id]);
        const newBalance = parseFloat(balRes.rows[0].balance);

        if (newBalance <= 0) {
          await suspendUser(row.user_id, row.username, row.company_id);
          suspended++;
        }
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[BILLING] Failed deduction for ${row.username}: ${err.message}`);
      } finally {
        client.release();
      }
    }

    console.log(`[BILLING] Deducted: ${deducted}, Suspended: ${suspended}`);
    return { deducted, suspended };
  } catch (err) {
    console.error(`[BILLING] Daily deduction error: ${err.message}`);
    throw err;
  }
};

// Suspend a user — set inactive + disconnect via auth strategy
const suspendUser = async (userId, username, companyId) => {
  try {
    // Mark user as inactive
    await pool.query('UPDATE users SET active = FALSE, updated_at = NOW() WHERE id = $1', [userId]);

    // Disconnect via router
    const routerConfig = await getRouterConfigForCompany(companyId);
    const strategy = getStrategy(routerConfig?.authType || 'radius');
    await strategy.onUserStatusChange(username, false, routerConfig);

    console.log(`[BILLING] Suspended user: ${username} (balance depleted)`);
  } catch (err) {
    console.error(`[BILLING] Suspend failed for ${username}: ${err.message}`);
  }
};

// Reactivate a user when balance becomes positive
const reactivateUser = async (userId, username, companyId) => {
  try {
    await pool.query('UPDATE users SET active = TRUE, updated_at = NOW() WHERE id = $1', [userId]);

    const routerConfig = await getRouterConfigForCompany(companyId);
    const strategy = getStrategy(routerConfig?.authType || 'radius');
    await strategy.onUserStatusChange(username, true, routerConfig);

    console.log(`[BILLING] Reactivated user: ${username} (balance topped up)`);
  } catch (err) {
    console.error(`[BILLING] Reactivate failed for ${username}: ${err.message}`);
  }
};

// Check and reactivate after top-up (call after voucher redeem / credit)
const checkAndReactivate = async (userId) => {
  try {
    const userRes = await pool.query(
      'SELECT id, username, company_id, balance, active FROM users WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];

    if (!user.active && parseFloat(user.balance) > 0) {
      await reactivateUser(user.id, user.username, user.company_id);
    }
  } catch (err) {
    console.error(`[BILLING] checkAndReactivate error: ${err.message}`);
  }
};

module.exports = { runDailyDeductions, suspendUser, reactivateUser, checkAndReactivate };
