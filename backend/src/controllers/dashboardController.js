const pool = require('../config/db');
const { getRouterConfigForCompany } = require('../services/routerResolver');
const sessionCache = require('../services/sessionCache');
const radiusDb = require('../config/radiusDb');

const getDashboardStats = async (req, res, next) => {
  try {
    const companyId = req.companyId;
    const { period = 'month' } = req.query; // 'day', 'week', 'month'

    // Determine interval based on period
    let interval = '30 days';
    if (period === 'day') interval = '1 day';
    if (period === 'week') interval = '7 days';
    if (period === 'month') interval = '30 days';

    // Run all queries in parallel
    const [
      customersRes,
      activeCustomersRes,
      inactiveCustomersRes,
      leadsRes,
      plansRes,
      ticketsRes,
      openTicketsRes,
      tasksRes,
      pendingTasksRes,
      revenueRes,
      recentCustomersRes,
      recentTicketsRes,
      recentLeadsRes,
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE company_id = $1', [companyId]),
      pool.query('SELECT COUNT(*) FROM users WHERE company_id = $1 AND active = TRUE', [companyId]),
      pool.query('SELECT COUNT(*) FROM users WHERE company_id = $1 AND active = FALSE', [companyId]),
      pool.query('SELECT COUNT(*) FROM leads WHERE company_id = $1', [companyId]),
      pool.query('SELECT COUNT(*) FROM plans WHERE company_id = $1 AND active = TRUE', [companyId]),
      pool.query('SELECT COUNT(*) FROM tickets WHERE company_id = $1', [companyId]),
      pool.query("SELECT COUNT(*) FROM tickets WHERE company_id = $1 AND status IN ('open', 'in_progress')", [companyId]),
      pool.query('SELECT COUNT(*) FROM tasks WHERE company_id = $1', [companyId]),
      pool.query("SELECT COUNT(*) FROM tasks WHERE company_id = $1 AND status IN ('todo', 'in_progress')", [companyId]),
      pool.query(`
        SELECT COALESCE(SUM(p.price), 0) AS monthly_revenue
        FROM user_plans up
        JOIN plans p ON up.plan_id = p.id
        JOIN users u ON up.user_id = u.id
        WHERE u.company_id = $1 AND up.active = TRUE
      `, [companyId]),
      pool.query(`
        SELECT u.id, u.full_name, u.username, u.seq_id, u.active,
          p.name AS plan_name,
          COALESCE(SUM(r.acctinputoctets), 0) AS download_bytes,
          COALESCE(SUM(r.acctoutputoctets), 0) AS upload_bytes,
          COALESCE(SUM(r.acctsessiontime), 0) AS total_time
        FROM users u
        LEFT JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
        LEFT JOIN plans p ON up.plan_id = p.id
        LEFT JOIN radacct r ON r.username = u.username AND r.acctstarttime >= (NOW() - INTERVAL '${interval}')
        WHERE u.company_id = $1
        GROUP BY u.id, u.full_name, u.username, u.seq_id, u.active, p.name
        ORDER BY SUM(r.acctinputoctets) DESC NULLS LAST
        LIMIT 10
      `, [companyId]),
      pool.query(`
        SELECT t.id, t.subject, t.status, t.priority, t.created_at,
          u.full_name AS customer_name
        FROM tickets t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.company_id = $1
        ORDER BY t.created_at DESC LIMIT 5
      `, [companyId]),
      pool.query(`
        SELECT id, full_name, phone, status, created_at
        FROM leads WHERE company_id = $1
        ORDER BY created_at DESC LIMIT 5
      `, [companyId]),
    ]);

    // Get online count — only count sessions matching actual DB customers
    let onlineCount = 0;
    try {
      const routerConfig = await getRouterConfigForCompany(companyId);
      const cached = await sessionCache.getSessions(companyId, routerConfig);
      if (cached.sessionMap?.size > 0) {
        const usernamesRes = await pool.query(
          'SELECT username FROM users WHERE company_id = $1', [companyId]
        );
        const dbUsernames = new Set(usernamesRes.rows.map(r => r.username));
        for (const [username] of cached.sessionMap) {
          if (dbUsernames.has(username)) onlineCount++;
        }
      }
    } catch { /* ignore router errors */ }

    // Lead breakdown by status
    const leadBreakdownRes = await pool.query(
      `SELECT status, COUNT(*) AS count FROM leads WHERE company_id = $1 GROUP BY status`, [companyId]
    );
    const leadBreakdown = {};
    leadBreakdownRes.rows.forEach(r => { leadBreakdown[r.status] = parseInt(r.count); });

    // Ticket breakdown by status
    const ticketBreakdownRes = await pool.query(
      `SELECT status, COUNT(*) AS count FROM tickets WHERE company_id = $1 GROUP BY status`, [companyId]
    );
    const ticketBreakdown = {};
    ticketBreakdownRes.rows.forEach(r => { ticketBreakdown[r.status] = parseInt(r.count); });

    res.json({
      success: true,
      data: {
        counts: {
          total_customers: parseInt(customersRes.rows[0].count) || 0,
          active_customers: parseInt(activeCustomersRes.rows[0].count) || 0,
          inactive_customers: parseInt(inactiveCustomersRes.rows[0].count) || 0,
          online_customers: onlineCount || 0,
          offline_customers: (parseInt(customersRes.rows[0].count) || 0) - (onlineCount || 0),
          total_leads: parseInt(leadsRes.rows[0].count) || 0,
          active_plans: parseInt(plansRes.rows[0].count) || 0,
          total_tickets: parseInt(ticketsRes.rows[0].count) || 0,
          open_tickets: parseInt(openTicketsRes.rows[0].count) || 0,
          total_tasks: parseInt(tasksRes.rows[0].count) || 0,
          pending_tasks: parseInt(pendingTasksRes.rows[0].count) || 0,
          monthly_revenue: parseFloat(revenueRes.rows[0].monthly_revenue) || 0,
        },
        lead_breakdown: leadBreakdown,
        ticket_breakdown: ticketBreakdown,
        top_bandwidth_users: recentCustomersRes.rows,
        recent_tickets: recentTicketsRes.rows,
        recent_leads: recentLeadsRes.rows,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getDashboardStats };
