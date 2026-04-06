const express = require('express');
const { getTickets, getTicketById, createTicket, updateTicket, addComment, deleteTicket } = require('../controllers/ticketsController');

const router = express.Router();

router.get('/', getTickets);
router.get('/:id', getTicketById);
router.post('/', createTicket);
router.put('/:id', updateTicket);
router.post('/:id/comments', addComment);
router.delete('/:id', deleteTicket);

module.exports = router;
