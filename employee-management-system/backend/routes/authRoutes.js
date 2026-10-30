const express = require('express');
const router = express.Router();
const {
  register, login, googleLogin,
  getMe, updateMe, changePassword,
  forgotPassword, setUserStatus,
} = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');
const User = require('../models/User');

// Public routes (rate-limited)
router.post('/register',        authLimiter, register);
router.post('/login',           authLimiter, login);
router.post('/google',          authLimiter, googleLogin);
router.post('/forgot-password', authLimiter, forgotPassword);

// Protected routes
router.get('/me',                protect, getMe);
router.put('/me',                protect, updateMe);
router.put('/change-password',   protect, changePassword);

// Admin: manage user accounts
router.get('/users', protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, count: users.length, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/users/:id/status', protect, adminOnly, setUserStatus);

module.exports = router;
