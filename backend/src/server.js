const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { errorHandler } = require('./middleware/errorHandler');
const { authenticate, requireActiveSubscription } = require('./middleware/auth');
const initDB = require('./db/init');

// Route imports
const authRoutes = require('./routes/auth');
const usersRoutes = require('./routes/users');
const plansRoutes = require('./routes/plans');
const leadsRoutes = require('./routes/leads');
const customersRoutes = require('./routes/customers');
const routersRoutes = require('./routes/routers');
const mikrotikRoutes = require('./routes/mikrotik');
const staffRoutes = require('./routes/staff');
const ticketsRoutes = require('./routes/tickets');
const tasksRoutes = require('./routes/tasks');
const documentsRoutes = require('./routes/documents');
const dashboardRoutes = require('./routes/dashboard');
const vouchersRoutes = require('./routes/vouchers');
const transactionsRoutes = require('./routes/transactions');
const portalRoutes = require('./routes/portal');
const notificationsRoutes = require('./routes/notifications');
const messagesRoutes = require('./routes/messages');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// ── Health check ───────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── Public Routes (no auth required) ───────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/portal', portalRoutes);

// ── Protected Routes (JWT + active subscription) ───────────
const protect = [authenticate, requireActiveSubscription];

app.use('/api/users', protect, usersRoutes);
app.use('/api/plans', protect, plansRoutes);
app.use('/api/leads', protect, leadsRoutes);
app.use('/api/customers', protect, customersRoutes);
app.use('/api/routers', protect, routersRoutes);
app.use('/api/mikrotik', protect, mikrotikRoutes);
app.use('/api/staff', protect, staffRoutes);
app.use('/api/tickets', protect, ticketsRoutes);
app.use('/api/tasks', protect, tasksRoutes);
app.use('/api/documents', protect, documentsRoutes);
app.use('/api/dashboard', protect, dashboardRoutes);
app.use('/api/vouchers', protect, vouchersRoutes);
app.use('/api/transactions', protect, transactionsRoutes);
app.use('/api/notifications', protect, notificationsRoutes);
app.use('/api/messages', protect, messagesRoutes);

// ── 404 handler ────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Central error handler ──────────────────────────────────
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────
const { runDailyDeductions } = require('./services/billingService');

const start = async () => {
  try {
    // Initialize database schema on startup
    await initDB();

    app.listen(PORT, () => {
      console.log(`[SERVER] CONNIS backend running on http://localhost:${PORT}`);
      console.log(`[SERVER] Environment: ${process.env.NODE_ENV || 'development'}`);
    });

    // Run daily billing deductions every 24 hours (at startup + interval)
    const BILLING_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
    setTimeout(() => {
      runDailyDeductions().catch(err => console.error('[CRON] Billing error:', err.message));
      setInterval(() => {
        runDailyDeductions().catch(err => console.error('[CRON] Billing error:', err.message));
      }, BILLING_INTERVAL);
    }, 60000); // Wait 1 min after startup before first run
  } catch (err) {
    console.error('[SERVER] Failed to start:', err.message);
    process.exit(1);
  }
};

start();
