const pool = require('../config/db');
const { getRouterConfigForCompany } = require('./routerResolver');
const { getStrategy } = require('./authStrategy');
const { recordTransaction, getComputedBalance } = require('./transactionHelper');

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

        // Record debit transaction (also syncs cached balance)
        await recordTransaction(client, {
          companyId: row.company_id,
          userId: row.user_id,
          amount: dailyCost.toFixed(2),
          type: 'debit',
          category: 'subscription',
          description: `Daily charge: ${row.plan_name}`,
        });

        await client.query('COMMIT');
        deducted++;

        // Check if balance is now <= 0 — suspend user
        const newBalance = await getComputedBalance(row.user_id);

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
      'SELECT id, username, company_id, active FROM users WHERE id = $1',
      [userId]
    );
    if (userRes.rows.length === 0) return;
    const user = userRes.rows[0];

    const balance = await getComputedBalance(userId);
    if (!user.active && balance > 0) {
      await reactivateUser(user.id, user.username, user.company_id);
    }
  } catch (err) {
    console.error(`[BILLING] checkAndReactivate error: ${err.message}`);
  }
};

module.exports = { runDailyDeductions, suspendUser, reactivateUser, checkAndReactivate };
