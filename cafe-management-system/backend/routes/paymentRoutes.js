const express = require('express');
const router = express.Router();
const {
  createRazorpayOrder,
  verifyPayment,
  recordManualPayment,
  getMyPayments,
  getPaymentReceipt,
} = require('../controllers/paymentController');
const { protect } = require('../middleware/authMiddleware');

// All payment routes require authentication
router.use(protect);

router.post('/create-order', createRazorpayOrder);      // Create Razorpay order
router.post('/verify', verifyPayment);                   // Verify Razorpay payment
router.post('/manual', recordManualPayment);             // Record Cash/UPI/etc payment
router.get('/my', getMyPayments);                        // Get current user's payments
router.get('/receipt/:orderId', getPaymentReceipt);      // Get payment receipt

module.exports = router;
