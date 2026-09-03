const User = require('../models/User');

/**
 * Middleware: verify the Authorization: Bearer <token> header.
 * Decodes the base64 user payload (same format as aiAuth for compatibility).
 * Sets req.user = { id, name, email, role, ... }
 */
const protect = async (req, res, next) => {
  try {
    const raw = req.headers['x-user-info'] || req.headers['authorization']?.replace('Bearer ', '');
    if (!raw) return res.status(401).json({ success: false, message: 'Authentication required' });

    let user;
    try {
      user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    if (!user || !user.id) return res.status(401).json({ success: false, message: 'Invalid token' });

    // Verify user still exists in DB
    const dbUser = await User.findById(user.id).select('-password');
    if (!dbUser) return res.status(401).json({ success: false, message: 'User not found' });

    req.user = { ...user, _id: dbUser._id, id: dbUser._id.toString(), dbUser };
    next();
  } catch (err) {
    res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

const adminOnly = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  if (!['Admin', 'HR', 'Manager'].includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, adminOnly };
