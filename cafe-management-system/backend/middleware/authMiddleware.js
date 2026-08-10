const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

/**
 * Protect routes — verifies JWT token
 * Attaches user object to req.user
 */
const protect = async (req, res, next) => {
  let token;

  // Check Authorization header for Bearer token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user to request (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ success: false, message: 'User not found' });
      }

      // Update user's lastSeen and isActive status (fire-and-forget — don't block next())
      User.findByIdAndUpdate(decoded.id, {
        isActive: true,
        lastSeen: new Date(),
      }).catch(() => {});

      // Update the latest LoginLog for this user to mark as active
      LoginLog.findOneAndUpdate(
        { user: decoded.id },
        { lastActivity: new Date(), isActive: true },
        { sort: { loginAt: -1 } }
      ).catch(() => {});

    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }

  // Call next() outside the try/catch so downstream errors propagate correctly
  next();
};

module.exports = { protect };
