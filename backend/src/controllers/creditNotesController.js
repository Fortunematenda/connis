const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const { recordTransaction, getComputedBalance } = require('../services/transactionHelper');

// Generate next credit note number: CN-YYYYMM-XXXX
const generateCreditNumber = async (companyId) => {
  const now = new Date();
  const prefix = `CN-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const result = await pool.query(
    `SELECT credit_number FROM credit_notes WHERE company_id = $1 AND credit_number LIKE $2 ORDER BY credit_number DESC LIMIT 1`,
    [companyId, `${prefix}-%`]
  );
  let seq = 1;
  if (result.rows.length > 0) {
    const last = parseInt(result.rows[0].credit_number.split('-').pop(), 10);
    if (!isNaN(last)) seq = last + 1;
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// GET /credit-notes
const getCreditNotes = async (req, res, next) => {
  try {
    const { status, user_id, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT cn.*, u.full_name AS customer_name, u.username AS customer_username,
        ca.full_name AS created_by_name
      FROM credit_notes cn
      LEFT JOIN users u ON cn.user_id = u.id
      LEFT JOIN company_admins ca ON cn.created_by = ca.id
      WHERE cn.company_id = $1
    `;
    const params = [req.companyId];
    if (status) { params.push(status); query += ` AND cn.status = $${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND cn.user_id = $${params.length}`; }
    query += ' ORDER BY cn.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /credit-notes/:id
const getCreditNoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const cnRes = await pool.query(
      `SELECT cn.*, u.full_name AS customer_name, u.username AS customer_username,
        ca.full_name AS created_by_name,
        c.name AS company_name, c.email AS company_email
      FROM credit_notes cn
      LEFT JOIN users u ON cn.user_id = u.id
      LEFT JOIN company_admins ca ON cn.created_by = ca.id
      LEFT JOIN companies c ON cn.company_id = c.id
      WHERE cn.id = $1 AND cn.company_id = $2`,
      [id, req.companyId]
    );
    if (cnRes.rows.length === 0) throw new ApiError(404, 'Credit note not found');

    const itemsRes = await pool.query(
      'SELECT * FROM credit_note_items WHERE credit_note_id = $1 ORDER BY created_at ASC', [id]
    );

    res.json({ success: true, data: { ...cnRes.rows[0], items: itemsRes.rows } });
  } catch (err) { next(err); }
};

// POST /credit-notes — Create credit note and optionally apply to balance
const createCreditNote = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, items, notes, invoice_id, apply_to_balance } = req.body;
    if (!user_id || !items || !items.length) throw new ApiError(400, 'user_id and at least one item required');

    // Verify user
    const userRes = await client.query(
      'SELECT id FROM users WHERE id = $1 AND company_id = $2', [user_id, req.companyId]
    );
    if (userRes.rows.length === 0) throw new ApiError(404, 'Customer not found');

    await client.query('BEGIN');
    const creditNumber = await generateCreditNumber(req.companyId);

    let subtotal = 0;
    const processed = items.map(item => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unit_price) || 0;
      const total = qty * price;
      subtotal += total;
      return { ...item, quantity: qty, unit_price: price, total };
    });

    const status = apply_to_balance ? 'applied' : 'issued';

    let transactionId = null;
    if (apply_to_balance) {
      const tx = await recordTransaction(client, {
        companyId: req.companyId,
        userId: user_id,
        amount: subtotal,
        type: 'credit',
        category: 'refund',
        description: `Credit note: ${creditNumber}`,
        reference: creditNumber,
        createdBy: req.adminId || null,
      });
      transactionId = tx.id;
    }

    const cnRes = await client.query(
      `INSERT INTO credit_notes (company_id, user_id, credit_number, status, subtotal, tax, total,
        notes, invoice_id, transaction_id, created_by)
       VALUES ($1,$2,$3,$4,$5,0,$5,$6,$7,$8,$9) RETURNING *`,
      [req.companyId, user_id, creditNumber, status, subtotal, notes || null,
       invoice_id || null, transactionId, req.adminId || null]
    );
    const cn = cnRes.rows[0];

    for (const item of processed) {
      await client.query(
        `INSERT INTO credit_note_items (credit_note_id, description, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5)`,
        [cn.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: cn });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PUT /credit-notes/:id/apply — Apply an issued credit note to balance
const applyCreditNote = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const cnRes = await client.query(
      'SELECT * FROM credit_notes WHERE id = $1 AND company_id = $2 AND status = $3 FOR UPDATE',
      [id, req.companyId, 'issued']
    );
    if (cnRes.rows.length === 0) throw new ApiError(404, 'Credit note not found or already applied');
    const cn = cnRes.rows[0];

    const tx = await recordTransaction(client, {
      companyId: req.companyId,
      userId: cn.user_id,
      amount: cn.total,
      type: 'credit',
      category: 'refund',
      description: `Credit note applied: ${cn.credit_number}`,
      reference: cn.credit_number,
      createdBy: req.adminId || null,
    });

    await client.query(
      'UPDATE credit_notes SET status = $1, transaction_id = $2, updated_at = NOW() WHERE id = $3',
      ['applied', tx.id, id]
    );

    await client.query('COMMIT');

    const balance = await getComputedBalance(cn.user_id);
    res.json({ success: true, data: { credit_note_id: id, new_balance: balance } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

module.exports = { getCreditNotes, getCreditNoteById, createCreditNote, applyCreditNote };
