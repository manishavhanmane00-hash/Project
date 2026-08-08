const express = require('express');
const router = express.Router();
const {
  placeOrder,
  getMyOrders,
  trackOrder,
  updateOrderStatus,
  getOrderById,
} = require('../controllers/orderController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

// All order routes require authentication
router.use(protect);

router.post('/', placeOrder);                               // Place new order
router.get('/my', getMyOrders);                             // Get my order history
router.get('/:id', getOrderById);                           // Get single order
router.get('/:id/track', trackOrder);                       // Track order status
router.patch('/:id/status', adminOnly, updateOrderStatus);  // Admin: update status

module.exports = router;
