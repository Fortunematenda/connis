const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');

// Generate next quote number: QUO-YYYYMM-XXXX
const generateQuoteNumber = async (companyId) => {
  const now = new Date();
  const prefix = `QUO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const result = await pool.query(
    `SELECT quote_number FROM quotes WHERE company_id = $1 AND quote_number LIKE $2 ORDER BY quote_number DESC LIMIT 1`,
    [companyId, `${prefix}-%`]
  );
  let seq = 1;
  if (result.rows.length > 0) {
    const last = parseInt(result.rows[0].quote_number.split('-').pop(), 10);
    if (!isNaN(last)) seq = last + 1;
  }
  return `${prefix}-${String(seq).padStart(4, '0')}`;
};

// GET /quotes
const getQuotes = async (req, res, next) => {
  try {
    const { status, user_id, limit = 100, offset = 0 } = req.query;
    let query = `
      SELECT q.*, u.full_name AS customer_name_db, u.username,
        ca.full_name AS created_by_name
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN company_admins ca ON q.created_by = ca.id
      WHERE q.company_id = $1
    `;
    const params = [req.companyId];
    if (status) { params.push(status); query += ` AND q.status = $${params.length}`; }
    if (user_id) { params.push(user_id); query += ` AND q.user_id = $${params.length}`; }
    query += ' ORDER BY q.created_at DESC';
    params.push(parseInt(limit)); query += ` LIMIT $${params.length}`;
    params.push(parseInt(offset)); query += ` OFFSET $${params.length}`;

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// GET /quotes/:id
const getQuoteById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const qRes = await pool.query(
      `SELECT q.*, u.full_name AS customer_name_db, u.username, u.email AS customer_email_db,
        u.phone AS customer_phone_db, u.address AS customer_address_db,
        ca.full_name AS created_by_name,
        c.name AS company_name, c.email AS company_email, c.phone AS company_phone,
        c.address AS company_address, c.bank_details
      FROM quotes q
      LEFT JOIN users u ON q.user_id = u.id
      LEFT JOIN company_admins ca ON q.created_by = ca.id
      LEFT JOIN companies c ON q.company_id = c.id
      WHERE q.id = $1 AND q.company_id = $2`,
      [id, req.companyId]
    );
    if (qRes.rows.length === 0) throw new ApiError(404, 'Quote not found');

    const itemsRes = await pool.query(
      'SELECT * FROM quote_items WHERE quote_id = $1 ORDER BY created_at ASC', [id]
    );

    res.json({ success: true, data: { ...qRes.rows[0], items: itemsRes.rows } });
  } catch (err) { next(err); }
};

// POST /quotes
const createQuote = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { user_id, items, notes, valid_until, customer_name, customer_email, customer_phone, customer_address, lead_id } = req.body;
    if (!items || !items.length) throw new ApiError(400, 'At least one line item required');

    await client.query('BEGIN');
    const quoteNumber = await generateQuoteNumber(req.companyId);

    let subtotal = 0;
    const processed = items.map(item => {
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unit_price) || 0;
      const total = qty * price;
      subtotal += total;
      return { ...item, quantity: qty, unit_price: price, total };
    });

    const qRes = await client.query(
      `INSERT INTO quotes (company_id, user_id, quote_number, status, subtotal, tax, total, notes, valid_until,
        customer_name, customer_email, customer_phone, customer_address, lead_id, created_by)
       VALUES ($1,$2,$3,'draft',$4,0,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [req.companyId, user_id || null, quoteNumber, subtotal, notes || null, valid_until || null,
       customer_name || null, customer_email || null, customer_phone || null, customer_address || null,
       lead_id || null, req.adminId || null]
    );
    const quote = qRes.rows[0];

    for (const item of processed) {
      await client.query(
        `INSERT INTO quote_items (quote_id, item_id, description, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5,$6)`,
        [quote.id, item.item_id || null, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: quote });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// PUT /quotes/:id/status
const updateQuoteStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const valid = ['draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'];
    if (!valid.includes(status)) throw new ApiError(400, `Invalid status. Must be: ${valid.join(', ')}`);

    const result = await pool.query(
      'UPDATE quotes SET status = $1, updated_at = NOW() WHERE id = $2 AND company_id = $3 RETURNING *',
      [status, id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Quote not found');
    res.json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// POST /quotes/:id/convert — Convert quote to invoice
const convertToInvoice = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;

    await client.query('BEGIN');

    const qRes = await client.query(
      'SELECT * FROM quotes WHERE id = $1 AND company_id = $2 FOR UPDATE', [id, req.companyId]
    );
    if (qRes.rows.length === 0) throw new ApiError(404, 'Quote not found');
    const quote = qRes.rows[0];
    if (quote.status === 'converted') throw new ApiError(400, 'Quote already converted');
    if (!quote.user_id) throw new ApiError(400, 'Quote must be linked to a customer to convert');

    // Generate invoice number
    const now = new Date();
    const invPrefix = `INV-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const invSeqRes = await client.query(
      `SELECT invoice_number FROM invoices WHERE company_id = $1 AND invoice_number LIKE $2 ORDER BY invoice_number DESC LIMIT 1`,
      [req.companyId, `${invPrefix}-%`]
    );
    let invSeq = 1;
    if (invSeqRes.rows.length > 0) {
      const l = parseInt(invSeqRes.rows[0].invoice_number.split('-').pop(), 10);
      if (!isNaN(l)) invSeq = l + 1;
    }
    const invoiceNumber = `${invPrefix}-${String(invSeq).padStart(4, '0')}`;

    const invRes = await client.query(
      `INSERT INTO invoices (company_id, user_id, invoice_number, status, type, subtotal, tax, total,
        amount_paid, notes, created_by)
       VALUES ($1,$2,$3,'issued','once_off',$4,$5,$6,0,$7,$8) RETURNING *`,
      [req.companyId, quote.user_id, invoiceNumber, quote.subtotal, quote.tax, quote.total,
       quote.notes, req.adminId || null]
    );
    const invoice = invRes.rows[0];

    // Copy line items
    const items = await client.query('SELECT * FROM quote_items WHERE quote_id = $1', [id]);
    for (const item of items.rows) {
      await client.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1,$2,$3,$4,$5)`,
        [invoice.id, item.description, item.quantity, item.unit_price, item.total]
      );
    }

    // Mark quote as converted
    await client.query(
      'UPDATE quotes SET status = $1, converted_to = $2, updated_at = NOW() WHERE id = $3',
      ['converted', invoice.id, id]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: { quote_id: id, invoice } });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally { client.release(); }
};

// DELETE /quotes/:id
const deleteQuote = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM quotes WHERE id = $1 AND company_id = $2 AND status IN ('draft') RETURNING id",
      [id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Quote not found or cannot be deleted');
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getQuotes, getQuoteById, createQuote, updateQuoteStatus, convertToInvoice, deleteQuote };
