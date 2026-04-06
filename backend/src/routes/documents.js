const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDocuments, uploadDocument, updateDocument, downloadDocument, deleteDocument } = require('../controllers/documentsController');

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../../uploads/documents'),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage, limits: { fileSize: 20 * 1024 * 1024 } }); // 20MB max

const router = express.Router();

router.get('/', getDocuments);
router.post('/', upload.single('file'), uploadDocument);
router.put('/:id', updateDocument);
router.get('/:id/download', downloadDocument);
router.delete('/:id', deleteDocument);

module.exports = router;
