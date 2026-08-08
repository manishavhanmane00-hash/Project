const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getAllOrders,
  getAllPayments,
  getLoginLogs,
  getAllUsers,
} = require('../controllers/adminController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All admin routes require authentication + admin role
router.use(protect, adminOnly);

router.get('/dashboard', getDashboardStats);   // Dashboard stats
router.get('/orders', getAllOrders);           // All orders with filters
router.get('/payments', getAllPayments);       // All payments + breakdown
router.get('/login-logs', getLoginLogs);       // Login activity logs
router.get('/users', getAllUsers);             // All customers

module.exports = router;
