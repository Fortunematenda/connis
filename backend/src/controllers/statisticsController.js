const pool = require('../config/db');
const radiusDb = require('../config/radiusDb');
const { ApiError } = require('../middleware/errorHandler');
const { getInterfaceTraffic } = require('../services/mikrotik');
const { getRouterConfigForCompany } = require('../services/routerResolver');

// GET /customers/:id/statistics — Fetch RADIUS accounting data for a customer
const getCustomerStatistics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { period } = req.query; // 'day', 'week', 'month' (default: month)

    // Get customer username
    const userRes = await pool.query(
      'SELECT username FROM users WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );
    if (userRes.rows.length === 0) {
      throw new ApiError(404, 'Customer not found');
    }
    const username = userRes.rows[0].username;

    // Determine date range
    const now = new Date();
    let startDate;
    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
      default:
        startDate = new Date(now);
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }

    // 1. Daily bandwidth usage (for chart)
    const dailyUsage = await radiusDb.query(
      `SELECT
        TO_CHAR(DATE(acctstarttime), 'YYYY-MM-DD') AS date,
        COALESCE(SUM(acctinputoctets), 0) AS download_bytes,
        COALESCE(SUM(acctoutputoctets), 0) AS upload_bytes,
        COUNT(*) AS sessions
      FROM radacct
      WHERE username = $1 AND acctstarttime >= $2::timestamptz
      GROUP BY DATE(acctstarttime)
      ORDER BY DATE(acctstarttime) ASC`,
      [username, startDate.toISOString()]
    );

    // 2. Total usage summary
    const totalUsage = await radiusDb.query(
      `SELECT
        COALESCE(SUM(acctinputoctets), 0) AS total_download,
        COALESCE(SUM(acctoutputoctets), 0) AS total_upload,
        COALESCE(SUM(acctsessiontime), 0) AS total_session_time,
        COUNT(*) AS total_sessions
      FROM radacct
      WHERE username = $1 AND acctstarttime >= $2`,
      [username, startDate.toISOString()]
    );

    // 3. Recent sessions (last 20)
    const recentSessions = await radiusDb.query(
      `SELECT
        acctsessionid,
        framedipaddress AS ip_address,
        callingstationid AS caller_id,
        nasipaddress AS nas_ip,
        acctstarttime AS start_time,
        acctstoptime AS stop_time,
        acctsessiontime AS session_time,
        acctinputoctets AS download_bytes,
        acctoutputoctets AS upload_bytes,
        acctterminatecause AS terminate_cause
      FROM radacct
      WHERE username = $1
      ORDER BY acctstarttime DESC
      LIMIT 20`,
      [username]
    );

    // 4. FUP Statistics — day / week / month summaries
    const fupQuery = (interval) => radiusDb.query(
      `SELECT
        COALESCE(SUM(acctinputoctets), 0) AS total_download,
        COALESCE(SUM(acctoutputoctets), 0) AS total_upload,
        COALESCE(SUM(acctsessiontime), 0) AS total_session_time
      FROM radacct
      WHERE username = $1 AND acctstarttime >= NOW() - $2::interval`,
      [username, interval]
    );
    const [fupDay, fupWeek, fupMonth] = await Promise.all([
      fupQuery('1 day'),
      fupQuery('7 days'),
      fupQuery('30 days'),
    ]);

    // 5. All-time totals
    const allTime = await radiusDb.query(
      `SELECT
        COALESCE(SUM(acctinputoctets), 0) AS total_download,
        COALESCE(SUM(acctoutputoctets), 0) AS total_upload,
        COALESCE(SUM(acctsessiontime), 0) AS total_session_time,
        COUNT(*) AS total_sessions,
        MIN(acctstarttime) AS first_session,
        MAX(acctstarttime) AS last_session
      FROM radacct
      WHERE username = $1`,
      [username]
    );

    res.json({
      success: true,
      data: {
        username,
        period: period || 'month',
        daily_usage: dailyUsage.rows.map(r => ({
          date: r.date instanceof Date ? r.date.toISOString().split('T')[0] : r.date,
          download: Number(r.download_bytes),
          upload: Number(r.upload_bytes),
          sessions: Number(r.sessions),
        })),
        summary: {
          download: Number(totalUsage.rows[0]?.total_download || 0),
          upload: Number(totalUsage.rows[0]?.total_upload || 0),
          session_time: Number(totalUsage.rows[0]?.total_session_time || 0),
          sessions: Number(totalUsage.rows[0]?.total_sessions || 0),
        },
        fup: {
          day: { download: Number(fupDay.rows[0]?.total_download || 0), upload: Number(fupDay.rows[0]?.total_upload || 0), online_time: Number(fupDay.rows[0]?.total_session_time || 0) },
          week: { download: Number(fupWeek.rows[0]?.total_download || 0), upload: Number(fupWeek.rows[0]?.total_upload || 0), online_time: Number(fupWeek.rows[0]?.total_session_time || 0) },
          month: { download: Number(fupMonth.rows[0]?.total_download || 0), upload: Number(fupMonth.rows[0]?.total_upload || 0), online_time: Number(fupMonth.rows[0]?.total_session_time || 0) },
        },
        all_time: {
          download: Number(allTime.rows[0]?.total_download || 0),
          upload: Number(allTime.rows[0]?.total_upload || 0),
          session_time: Number(allTime.rows[0]?.total_session_time || 0),
          sessions: Number(allTime.rows[0]?.total_sessions || 0),
          first_session: allTime.rows[0]?.first_session,
          last_session: allTime.rows[0]?.last_session,
        },
        recent_sessions: recentSessions.rows.map(s => ({
          id: s.acctsessionid,
          ip: s.ip_address,
          caller_id: s.caller_id,
          nas_ip: s.nas_ip,
          start: s.start_time,
          stop: s.stop_time,
          duration: Number(s.session_time || 0),
          download: Number(s.download_bytes || 0),
          upload: Number(s.upload_bytes || 0),
          terminate_cause: s.terminate_cause,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

// GET /customers/:id/bandwidth — Live bandwidth from MikroTik interface
const getLiveBandwidth = async (req, res, next) => {
  try {
    const { id } = req.params;

    const userRes = await pool.query(
      'SELECT username FROM users WHERE id = $1 AND company_id = $2',
      [id, req.companyId]
    );
    if (userRes.rows.length === 0) {
      throw new ApiError(404, 'Customer not found');
    }
    const username = userRes.rows[0].username;

    const routerConfig = await getRouterConfigForCompany(req.companyId);
    const traffic = await getInterfaceTraffic(username, routerConfig);
    if (!traffic) {
      return res.json({ success: true, data: null }); // user offline
    }

    res.json({ success: true, data: traffic });
  } catch (err) {
    next(err);
  }
};

module.exports = { getCustomerStatistics, getLiveBandwidth };
