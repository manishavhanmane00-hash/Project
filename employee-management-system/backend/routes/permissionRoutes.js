const express = require('express');
const router = express.Router();
const {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
} = require('../controllers/permissionController');
const { protect, superAdminOnly } = require('../middleware/auth');

// All permission management is Admin-only (HR excluded — superAdminOnly = Admin only).
router.use(protect);

router.get('/', superAdminOnly, getAllPermissions);
router.get('/:role', superAdminOnly, getRolePermissions);
router.put('/:role', superAdminOnly, updateRolePermissions);

module.exports = router;
