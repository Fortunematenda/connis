const pool = require('../config/db');
const { ApiError } = require('../middleware/errorHandler');
const path = require('path');
const fs = require('fs');

const UPLOAD_DIR = path.join(__dirname, '../../uploads/documents');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// GET /documents — list documents for company (optionally filter by user_id)
const getDocuments = async (req, res, next) => {
  try {
    const { user_id } = req.query;
    let query = `
      SELECT d.*, u.full_name AS customer_name,
        ca.full_name AS uploaded_by_name
      FROM documents d
      LEFT JOIN users u ON d.user_id = u.id
      LEFT JOIN company_admins ca ON d.uploaded_by = ca.id
      WHERE d.company_id = $1
    `;
    const params = [req.companyId];
    if (user_id) { params.push(user_id); query += ` AND d.user_id = $${params.length}`; }
    query += ' ORDER BY d.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ success: true, data: result.rows });
  } catch (err) { next(err); }
};

// POST /documents — upload a document
const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) throw new ApiError(400, 'No file uploaded');
    const { user_id, ticket_id } = req.body;

    const result = await pool.query(
      `INSERT INTO documents (company_id, user_id, ticket_id, name, file_path, file_size, mime_type, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [req.companyId, user_id || null, ticket_id || null,
       req.file.originalname, req.file.path, req.file.size, req.file.mimetype, req.adminId || null]
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (err) { next(err); }
};

// GET /documents/:id/download — download a document
const downloadDocument = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT * FROM documents WHERE id = $1 AND company_id = $2',
      [req.params.id, req.companyId]
    );
    if (result.rows.length === 0) throw new ApiError(404, 'Document not found');
    const doc = result.rows[0];
    if (!fs.existsSync(doc.file_path)) throw new ApiError(404, 'File not found on disk');
    res.download(doc.file_path, doc.name);
  } catch (err) { next(err); }
};

// DELETE /documents/:id
const deleteDocument = async (req, res, next) => {
  try {
    const result = await pool.query(
      'DELETE FROM documents WHERE id = $1 AND company_id = $2 RETURNING file_path',
      [req.params.id, req.companyId]
    );
    if (result.rows.length > 0 && result.rows[0].file_path) {
      try { fs.unlinkSync(result.rows[0].file_path); } catch { /* ignore */ }
    }
    res.json({ success: true });
  } catch (err) { next(err); }
};

module.exports = { getDocuments, uploadDocument, downloadDocument, deleteDocument };
