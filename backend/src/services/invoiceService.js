const pool = require('../config/db');

// ── Generate next invoice number for a company: INV-YYYYMM-XXXX ──
const generateInvoiceNumber = async (companyId) => {
  const now = new Date();
  const prefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;

  const result = await pool.query(
    `SELECT invoice_number FROM invoices
     WHERE company_id = $1 AND invoice_number LIKE $2
     ORDER BY invoice_number DESC LIMIT 1`,
    [companyId, `${prefix}-%`]
  );

  let seq = 1;
  if (result.rows.length > 0) {
    const last = result.rows[0].invoice_number;
    const lastSeq = parseInt(last.split('-').pop(), 10);
    if (!isNaN(lastSeq)) seq = lastSeq + 1;
  }

  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// ── Create an invoice with line items ──
// items: [{ description, quantity, unit_price }]
const createInvoice = async (client, {
  companyId, userId, type, items, notes,
  periodStart, periodEnd, transactionId, createdBy, status, paidAt
}) => {
  const invoiceNumber = await generateInvoiceNumber(companyId);

  // Calculate totals
  let subtotal = 0;
  const processedItems = items.map(item => {
    const qty = parseFloat(item.quantity) || 1;
    const price = parseFloat(item.unit_price) || 0;
    const total = qty * price;
    subtotal += total;
    return { ...item, quantity: qty, unit_price: price, total };
  });

  const tax = 0; // Can be extended with tax_rate from company settings
  const total = subtotal + tax;
  const invoiceStatus = status || 'paid';
  const amountPaid = invoiceStatus === 'paid' ? total : 0;

  const invRes = await client.query(
    `INSERT INTO invoices
      (company_id, user_id, invoice_number, status, type, subtotal, tax, total,
       amount_paid, notes, due_date, paid_at, period_start, period_end,
       transaction_id, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
     RETURNING *`,
    [
      companyId, userId, invoiceNumber, invoiceStatus, type || 'subscription',
      subtotal, tax, total, amountPaid, notes || null,
      periodEnd || null, paidAt || (invoiceStatus === 'paid' ? new Date() : null),
      periodStart || null, periodEnd || null,
      transactionId || null, createdBy || null,
    ]
  );

  const invoice = invRes.rows[0];

  // Insert line items
  for (const item of processedItems) {
    await client.query(
      `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
       VALUES ($1, $2, $3, $4, $5)`,
      [invoice.id, item.description, item.quantity, item.unit_price, item.total]
    );
  }

  return invoice;
};

// ── Generate invoice for a subscription plan (after payment) ──
const generateSubscriptionInvoice = async (client, {
  companyId, userId, planName, planPrice, periodStart, periodEnd,
  transactionId, createdBy
}) => {
  return createInvoice(client, {
    companyId,
    userId,
    type: 'subscription',
    items: [{
      description: `Internet Service: ${planName}`,
      quantity: 1,
      unit_price: planPrice,
    }],
    notes: `Monthly subscription for ${planName}`,
    periodStart,
    periodEnd,
    transactionId,
    createdBy,
    status: 'paid',
    paidAt: new Date(),
  });
};

// ── Generate invoice for voucher redemption ──
const generateVoucherInvoice = async (client, {
  companyId, userId, voucherCode, amount, transactionId, createdBy
}) => {
  return createInvoice(client, {
    companyId,
    userId,
    type: 'once_off',
    items: [{
      description: `Voucher top-up: ${voucherCode}`,
      quantity: 1,
      unit_price: amount,
    }],
    notes: `Voucher ${voucherCode} redeemed`,
    transactionId,
    createdBy,
    status: 'paid',
    paidAt: new Date(),
  });
};

// ── Generate invoice for manual credit (payment received) ──
const generatePaymentInvoice = async (client, {
  companyId, userId, amount, description, transactionId, createdBy
}) => {
  return createInvoice(client, {
    companyId,
    userId,
    type: 'once_off',
    items: [{
      description: description || 'Payment received',
      quantity: 1,
      unit_price: amount,
    }],
    notes: description || 'Manual payment',
    transactionId,
    createdBy,
    status: 'paid',
    paidAt: new Date(),
  });
};

// ── Generate proforma invoice on lead conversion ──
const generateConversionInvoice = async (client, {
  companyId, userId, planName, planPrice, createdBy
}) => {
  const now = new Date();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  return createInvoice(client, {
    companyId,
    userId,
    type: 'subscription',
    items: [{
      description: `Internet Service: ${planName} (initial setup)`,
      quantity: 1,
      unit_price: planPrice,
    }],
    notes: `First invoice — account activated`,
    periodStart: now.toISOString().split('T')[0],
    periodEnd: endOfMonth.toISOString().split('T')[0],
    createdBy,
    status: 'issued',
  });
};

// ── Monthly recurring invoice generation (called by billing cron) ──
const generateMonthlyInvoices = async () => {
  console.log('[INVOICES] Generating monthly recurring invoices...');

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const monthLabel = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  try {
    // Find all active recurring subscriptions
    const result = await pool.query(`
      SELECT u.id AS user_id, u.company_id, u.username,
             p.name AS plan_name, p.price AS plan_price, p.billing_type,
             up.start_date, up.end_date
      FROM users u
      JOIN user_plans up ON u.id = up.user_id AND up.active = TRUE
      JOIN plans p ON up.plan_id = p.id
      WHERE u.active = TRUE
    `);

    let generated = 0;

    for (const row of result.rows) {
      // Check if invoice already exists for this user this month
      const existing = await pool.query(
        `SELECT id FROM invoices
         WHERE user_id = $1 AND company_id = $2
           AND type = 'subscription'
           AND period_start = $3`,
        [row.user_id, row.company_id, monthStart.toISOString().split('T')[0]]
      );
      if (existing.rows.length > 0) continue;

      // For recurring: always generate issued invoice at start of month
      // For prepaid: only generate if they have balance (daily deductions handle the rest)
      if (row.billing_type === 'prepaid') continue;

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await createInvoice(client, {
          companyId: row.company_id,
          userId: row.user_id,
          type: 'subscription',
          items: [{
            description: `Internet Service: ${row.plan_name} (${monthLabel})`,
            quantity: 1,
            unit_price: parseFloat(row.plan_price),
          }],
          notes: `Monthly subscription — ${row.plan_name}`,
          periodStart: monthStart.toISOString().split('T')[0],
          periodEnd: monthEnd.toISOString().split('T')[0],
          status: 'issued',
        });

        await client.query('COMMIT');
        generated++;
      } catch (err) {
        await client.query('ROLLBACK');
        console.error(`[INVOICES] Failed for ${row.username}: ${err.message}`);
      } finally {
        client.release();
      }
    }

    console.log(`[INVOICES] Generated ${generated} monthly invoices`);
    return { generated };
  } catch (err) {
    console.error(`[INVOICES] Monthly generation error: ${err.message}`);
    throw err;
  }
};

module.exports = {
  generateInvoiceNumber,
  createInvoice,
  generateSubscriptionInvoice,
  generateVoucherInvoice,
  generatePaymentInvoice,
  generateConversionInvoice,
  generateMonthlyInvoices,
};
