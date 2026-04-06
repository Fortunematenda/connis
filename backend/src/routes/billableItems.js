const express = require('express');
const { getItems, getItemById, createItem, updateItem, deleteItem, syncFromPlans } = require('../controllers/billableItemsController');

const router = express.Router();

router.get('/', getItems);
router.get('/:id', getItemById);
router.post('/', createItem);
router.post('/sync-plans', syncFromPlans);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);

module.exports = router;
