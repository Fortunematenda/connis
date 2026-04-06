const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { createInvoice } = require('../services/invoiceService');
const { recordTransaction } = require('../services/transactionHelper');

// GET /invoices — List invoices for company (admin)
const getInvoices = async (req, res, next) => {
  try {
    const { user_id, status, type, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT i.*, u.full_name AS customer_name, u.username AS customer_username,
        u.seq_id AS customer_seq_id,
        ca.full_name AS created_by_name
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN company_admins ca ON i.created_by = ca.id
      WHERE i.company_id = $1
    `;
    const params = [req.companyId];
    if (user_id) { params.push(user_id); query += ` AND i.user_id = $${params.length}`; }
    if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
    if (type) { params.push(type); query += ` AND i.type = $${params.length}`; }
    query += ' ORDER BY i.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);

    // Totals summary
    const summaryRes = await pool.query(
      `SELECT
         COUNT(*) AS total_invoices,
         COUNT(*) FILTER (WHERE status = 'paid') AS paid_count,
         COUNT(*) FILTER (WHERE status = 'issued') AS issued_count,
         COUNT(*) FILTER (WHERE status = 'overdue') AS overdue_count,
         COALESCE(SUM(total), 0) AS total_amount,
         COALESCE(SUM(amount_paid), 0) AS total_paid,
         COALESCE(SUM(total) - SUM(amount_paid), 0) AS total_outstanding
       FROM invoices WHERE company_id = $1`,
      [req.companyId]
    );

    res.json({
      success: true,
      summary: summaryRes.rows[0],
      data: result.rows,
    });
  } catch (err) { next(err); }
};

// GET /invoices/user/:userId — Invoices for a specific customer
const getUserInvoices = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { status, limit = 50, offset = 0 } = req.query;

    const userRes = await pool.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [userId, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    let query = `
      SELECT i.*, ca.full_name AS created_by_name
      FROM invoices i
      LEFT JOIN company_admins ca ON i.created_by = ca.id
      WHERE i.user_id = $1 AND i.company_id = $2
    `;
    const params = [userId, req.companyId];
    if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
    query += ' ORDER BY i.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /invoices/:id — Single invoice with line items
const getInvoiceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const invRes = await pool.query(
      `SELECT i.*, u.full_name AS customer_name, u.username AS customer_username,
        u.email AS customer_email, u.phone AS customer_phone, u.address AS customer_address,
        u.seq_id AS customer_seq_id,
        ca.full_name AS created_by_name,
        c.name AS company_name, c.email AS company_email, c.phone AS company_phone,
        c.address AS company_address, c.bank_details
      FROM invoices i
      LEFT JOIN users u ON i.user_id = u.id
      LEFT JOIN company_admins ca ON i.created_by = ca.id
      LEFT JOIN companies c ON i.company_id = c.id
      WHERE i.id = $1 AND i.company_id = $2`,
      [id, req.companyId]
    );

    if (invRes.rows.length === 0) throw new ApiError(404, 'Invoice not found');

    const itemsRes = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1 ORDER BY created_at ASC',
      [id]
    );

    res.json({
      success: true,
      data: { ...invRes.rows[0], items: itemsRes.rows },
    });
  } catch (err) { next(err); }
};

// POST /invoices — Create manual invoice (admin)
const createManualInvoice = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, type, items, notes, due_date, period_start, period_end } = req.body;
    if (!user_id || !items || !items.length) {
      throw new ApiError(400, 'user_id and at least one line item required');
    }

    // Verify user belongs to company
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    await client.query('BEGIN');

    const invoice = await createInvoice(client, {
      companyId: req.companyId,
      userId: user_id,
      type: type || 'once_off',
      items,
      notes,
      periodStart: period_start,
      periodEnd: period_end,
      createdBy: req.adminId || null,
      status: 'issued',
    });

    // Record debit transaction — customer now owes this amount
    const tx = await recordTransaction(client, {
      companyId: req.companyId,
      userId: user_id,
      amount: invoice.total,
      type: 'debit',
      category: 'manual',
      description: `Invoice ${invoice.invoice_number}`,
      reference: invoice.invoice_number,
      createdBy: req.adminId || null,
    });

    // Link transaction to invoice
    await client.query('UPDATE invoices SET transaction_id = $1 WHERE id = $2', [tx.id, invoice.id]);

    await client.query('COMMIT');

    res.status(201).json({ success: true, data: invoice });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

// PUT /invoices/:id/status — Update invoice status (e.g. mark paid, cancel)
const updateInvoiceStatus = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    const validStatuses = ['draft', 'issued', 'paid', 'cancelled', 'overdue'];
    if (!validStatuses.includes(status)) {
      throw new ApiError(400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    await client.query('BEGIN');

    // Fetch current invoice
    const invRes = await client.query(
      'SELECT * FROM invoices WHERE id = $1 AND company_id = $2 FOR UPDATE',
      [id, req.companyId]
    );
    if (invRes.rows.length === 0) throw new ApiError(404, 'Invoice not found');
    const invoice = invRes.rows[0];

    const updates = ['status = $1', 'updated_at = NOW()'];
    const params = [status, id, req.companyId];

    if (status === 'paid' && invoice.status !== 'paid') {
      updates.push('paid_at = NOW()');
      updates.push('amount_paid = total');

      // Record credit transaction — payment received
      await recordTransaction(client, {
        companyId: req.companyId,
        userId: invoice.user_id,
        amount: parseFloat(invoice.total),
        type: 'credit',
        category: 'payment',
        description: `Payment for ${invoice.invoice_number}`,
        reference: invoice.invoice_number,
        createdBy: req.adminId || null,
      });
    }

    if (status === 'cancelled' && invoice.status === 'issued') {
      // Reverse the debit if cancelling an issued invoice
      await recordTransaction(client, {
        companyId: req.companyId,
        userId: invoice.user_id,
        amount: parseFloat(invoice.total),
        type: 'credit',
        category: 'adjustment',
        description: `Invoice cancelled: ${invoice.invoice_number}`,
        reference: invoice.invoice_number,
        createdBy: req.adminId || null,
      });
    }

    const result = await client.query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $2 AND company_id = $3 RETURNING *`,
      params
    );

    await client.query('COMMIT');

    res.json({ success: true, data: result.rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
};

module.exports = { getInvoices, getUserInvoices, getInvoiceById, createManualInvoice, updateInvoiceStatus };
