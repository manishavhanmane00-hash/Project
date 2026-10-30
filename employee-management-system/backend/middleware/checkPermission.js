const { resolvePermissionsForRole } = require('../controllers/permissionController');

/**
 * Middleware factory: enforce that the authenticated user's role has the given
 * module/submodule permission enabled. Must run AFTER `protect` (sets req.user).
 *
 * Admin always passes. Managed roles are checked against their live, DB-backed
 * permission map — so changes apply without re-login.
 *
 * Usage: router.get('/', protect, checkPermission('payroll'), handler)
 */
const checkPermission = (moduleKey) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (req.user.role === 'Admin') return next();

    const { permissions } = await resolvePermissionsForRole(req.user.role);
    if (permissions[moduleKey] === true) return next();

    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this module.',
      module: moduleKey,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

/**
 * Middleware factory: enforce an ACTION (view/add/edit/delete/manage) on a
 * top-level module. Admin always passes. Must run AFTER `protect`.
 *
 * Usage: router.post('/', protect, checkAction('payroll', 'add'), handler)
 */
const checkAction = (moduleKey, action) => async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    if (req.user.role === 'Admin') return next();

    const { actions } = await resolvePermissionsForRole(req.user.role);
    const moduleActions = actions && actions[moduleKey];
    if (moduleActions && moduleActions[action] === true) return next();

    return res.status(403).json({
      success: false,
      message: `You do not have permission to ${action} in this module.`,
      module: moduleKey,
      action,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { checkPermission, checkAction };
