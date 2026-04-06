const express = require('express');
const { getCreditNotes, getCreditNoteById, createCreditNote, applyCreditNote } = require('../controllers/creditNotesController');

const router = express.Router();

router.get('/', getCreditNotes);
router.get('/:id', getCreditNoteById);
router.post('/', createCreditNote);
router.put('/:id/apply', applyCreditNote);

module.exports = router;
