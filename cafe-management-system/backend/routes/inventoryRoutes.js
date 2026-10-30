const express = require('express');
const router = express.Router();
const {
  listInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  getInventoryMovements,
} = require('../controllers/inventoryController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/', listInventory);
router.post('/', createInventoryItem);
router.put('/:id', updateInventoryItem);
router.patch('/:id/adjust', adjustInventoryStock);
router.get('/movements', getInventoryMovements);

module.exports = router;
