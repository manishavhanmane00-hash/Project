/**
 * Admin Middleware
 * Must be used AFTER the protect middleware
 * Ensures only users with role 'admin' can access admin routes
 */
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }
};

module.exports = { adminOnly };
