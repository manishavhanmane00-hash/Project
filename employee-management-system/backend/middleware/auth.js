const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: verify the Authorization: Bearer <token> header.
 * Decodes and verifies the JWT signature using JWT_SECRET.
 * Sets req.user = { id, name, email, role, ... } from the verified token payload.
 * Rejects expired or tampered tokens, and inactive accounts.
 */
const protect = async (req, res, next) => {
  try {
    let token;
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // Backwards-compat: accept x-user-info only if it is a real JWT (not base64 JSON)
    if (!token && req.headers['x-user-info']) {
      token = req.headers['x-user-info'];
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify the JWT signature and expiry
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      const message =
        err.name === 'TokenExpiredError' ? 'Your session has expired. Please log in again.'
        : 'Invalid authentication token.';
      return res.status(401).json({ success: false, message });
    }

    if (!decoded || !decoded.id) {
      return res.status(401).json({ success: false, message: 'Invalid token payload' });
    }

    // Verify the user still exists and is active
    const dbUser = await User.findById(decoded.id).select('-password');
    if (!dbUser) {
      return res.status(401).json({ success: false, message: 'User no longer exists' });
    }
    if (!dbUser.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Contact an administrator.' });
    }

    // Attach a sanitized user object to the request
    req.user = {
      id:          dbUser._id.toString(),
      _id:         dbUser._id,
      name:        dbUser.name,
      email:       dbUser.email,
      role:        dbUser.role,
      designation: dbUser.designation,
      department:  dbUser.department,
      phone:       dbUser.phone,
      avatar:      dbUser.avatar,
      isActive:    dbUser.isActive,
      employeeRef: dbUser.employeeRef,
      dbUser, // full document for controllers that need more fields
    };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

/**
 * Restrict to Admin / HR roles only.
 * (Manager is intentionally excluded from administrative actions
 *  such as leave approval per the security requirements.)
 */
const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!['Admin', 'HR'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Administrator access required' });
  }
  next();
};

/**
 * Restrict to Admin only (HR excluded).
 */
const superAdminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (req.user.role !== 'Admin') {
    return res.status(403).json({ success: false, message: 'Admin-only access' });
  }
  next();
};

module.exports = { protect, adminOnly, superAdminOnly };
