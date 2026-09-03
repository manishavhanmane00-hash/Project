/**
 * AI Auth Middleware
 * Reads the lightweight session token passed from the React frontend
 * via the X-User-Info header (base64-encoded JSON user object from localStorage).
 *
 * This keeps AI endpoints role-aware without requiring a full backend auth system.
 * IMPORTANT: API keys remain on the server — never sent to the client.
 */

const parseUserInfo = (req, res, next) => {
  try {
    const raw = req.headers['x-user-info'];
    if (!raw) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    const user = JSON.parse(Buffer.from(raw, 'base64').toString('utf8'));
    if (!user || !user.id || !user.role) {
      return res.status(401).json({ success: false, message: 'Invalid authentication token' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Authentication failed' });
  }
};

/**
 * Require Admin, HR, or Manager role for admin-only AI endpoints
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  const adminRoles = ['Admin', 'HR', 'Manager'];
  if (!adminRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Access denied. Admin/HR role required.' });
  }
  next();
};

/**
 * Allow any authenticated user (admin + employee)
 */
const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated' });
  next();
};

module.exports = { parseUserInfo, requireAdmin, requireAuth };
