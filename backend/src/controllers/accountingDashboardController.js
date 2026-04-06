const pool = require('../config/db');

const getAccountingDashboard = async (req, res, next) => {
  try {
    const companyId = req.companyId;

    const [
      invoiceSummary,
      monthlyRevenue,
      recentInvoices,
      recentTransactions,
      creditNoteSummary,
      quoteSummary,
      topCustomers,
    ] = await Promise.all([
      // Invoice totals by status
      pool.query(`
        SELECT
          COUNT(*) AS total_invoices,
          COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
          COUNT(*) FILTER (WHERE status = 'issued') AS issued_count,
          COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
          COUNT(*) FILTER (WHERE status = 'credited') AS credited_count,
          COALESCE(SUM(total), 0) AS total_invoiced,
          COALESCE(SUM(total) FILTER (WHERE status = 'paid'), 0) AS total_paid,
          COALESCE(SUM(total) FILTER (WHERE status = 'issued'), 0) AS total_outstanding,
          COALESCE(SUM(total) FILTER (WHERE status = 'overdue'), 0) AS total_overdue
        FROM invoices WHERE company_id = $1
      `, [companyId]),

      // Monthly revenue (paid invoices grouped by month, last 6 months)
      pool.query(`
        SELECT
          TO_CHAR(DATE_TRUNC('month', paid_at), 'Mon YYYY') AS month,
          DATE_TRUNC('month', paid_at) AS month_date,
          COALESCE(SUM(total), 0) AS revenue
        FROM invoices
        WHERE company_id = $1 AND status = 'paid' AND paid_at >= NOW() - INTERVAL '6 months'
        GROUP BY DATE_TRUNC('month', paid_at)
        ORDER BY month_date ASC
      `, [companyId]),

      // Recent invoices
      pool.query(`
        SELECT i.id, i.invoice_number, i.status, i.total, i.created_at,
          u.full_name AS customer_name
        FROM invoices i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.company_id = $1
        ORDER BY i.created_at DESC LIMIT 10
      `, [companyId]),

      // Recent transactions
      pool.query(`
        SELECT t.id, t.amount, t.type, t.category, t.description, t.created_at,
          u.full_name AS customer_name
        FROM transactions t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.company_id = $1
        ORDER BY t.created_at DESC LIMIT 10
      `, [companyId]),

      // Credit notes summary
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COALESCE(SUM(total), 0) AS total_amount,
          COUNT(*) FILTER (WHERE status = 'applied') AS applied_count
        FROM credit_notes WHERE company_id = $1
      `, [companyId]),

      // Quotes summary
      pool.query(`
        SELECT
          COUNT(*) AS total,
          COUNT(*) FILTER (WHERE status = 'draft') AS draft_count,
          COUNT(*) FILTER (WHERE status = 'sent') AS sent_count,
          COUNT(*) FILTER (WHERE status = 'accepted') AS accepted_count,
          COUNT(*) FILTER (WHERE status = 'converted') AS converted_count,
          COALESCE(SUM(total) FILTER (WHERE status IN ('sent','accepted')), 0) AS pipeline_value
        FROM quotes WHERE company_id = $1
      `, [companyId]),

      // Top customers by revenue (paid invoices)
      pool.query(`
        SELECT u.id, u.full_name, u.username,
          COALESCE(SUM(i.total), 0) AS total_paid
        FROM invoices i
        JOIN users u ON i.user_id = u.id
        WHERE i.company_id = $1 AND i.status = 'paid'
        GROUP BY u.id, u.full_name, u.username
        ORDER BY total_paid DESC
        LIMIT 5
      `, [companyId]),
    ]);

    // Current month revenue
    const currentMonthRes = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS amount
      FROM invoices
      WHERE company_id = $1 AND status = 'paid'
        AND paid_at >= DATE_TRUNC('month', NOW())
    `, [companyId]);

    // Last month revenue for comparison
    const lastMonthRes = await pool.query(`
      SELECT COALESCE(SUM(total), 0) AS amount
      FROM invoices
      WHERE company_id = $1 AND status = 'paid'
        AND paid_at >= DATE_TRUNC('month', NOW() - INTERVAL '1 month')
        AND paid_at < DATE_TRUNC('month', NOW())
    `, [companyId]);

    res.json({
      success: true,
      data: {
        invoices: invoiceSummary.rows[0],
        current_month_revenue: parseFloat(currentMonthRes.rows[0].amount),
        last_month_revenue: parseFloat(lastMonthRes.rows[0].amount),
        monthly_revenue: monthlyRevenue.rows,
        credit_notes: creditNoteSummary.rows[0],
        quotes: quoteSummary.rows[0],
        top_customers: topCustomers.rows,
        recent_invoices: recentInvoices.rows,
        recent_transactions: recentTransactions.rows,
      },
    });
  } catch (err) { next(err); }
};

module.exports = { getAccountingDashboard };
