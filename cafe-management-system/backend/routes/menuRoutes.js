const express = require('express');
const router = express.Router();
const {
  getAllMenu,
  getMenuById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  addSubItem,
  updateSubItem,
  deleteSubItem,
} = require('../controllers/menuController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// Public routes
router.get('/', getAllMenu);
router.get('/:id', getMenuById);

// Admin-only routes
router.post('/', protect, adminOnly, createMenuItem);
router.put('/:id', protect, adminOnly, updateMenuItem);
router.delete('/:id', protect, adminOnly, deleteMenuItem);
router.post('/:id/subitems', protect, adminOnly, addSubItem);
router.put('/:id/subitems/:subId', protect, adminOnly, updateSubItem);
router.delete('/:id/subitems/:subId', protect, adminOnly, deleteSubItem);

module.exports = router;
