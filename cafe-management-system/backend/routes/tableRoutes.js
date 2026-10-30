const express = require('express');
const router = express.Router();
const {
  listTables,
  createTable,
  updateTable,
  deleteTable,
  updateTableStatus,
} = require('../controllers/tableController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.get('/', listTables);
router.use(protect, adminOnly);
router.post('/', createTable);
router.put('/:id', updateTable);
router.patch('/:id/status', updateTableStatus);
router.delete('/:id', deleteTable);

module.exports = router;
