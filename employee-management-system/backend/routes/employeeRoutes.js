const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  getMyEmployeeRecord,
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  deleteEmployee,
  getDrafts,
  getDraftById,
  saveDraft,
  deleteDraft,
} = require('../controllers/employeeController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

// All employee routes require authentication
router.use(protect);

// Current user's own employee record (employee self-service — no module permission needed)
router.get('/me', getMyEmployeeRecord);

// ── Draft routes (must be declared before '/:id' to avoid route conflicts) ────
// Drafts are created/edited by anyone allowed to add employees.
router.route('/drafts')
  .get(checkAction('employees', 'add'), getDrafts)
  .post(checkAction('employees', 'add'), saveDraft);

router.route('/drafts/:id')
  .get(checkAction('employees', 'add'), getDraftById)
  .put(checkAction('employees', 'add'), saveDraft)
  .delete(checkAction('employees', 'add'), deleteDraft);

router.route('/')
  // The controller already restricts Employee-role callers to their own record,
  // so listing is allowed for any authenticated user; management needs the
  // 'add' action on the employees module (Admin always passes).
  .get(getEmployees)
  .post(checkAction('employees', 'add'), createEmployee);

// Status toggle must come before /:id to avoid route conflict
router.patch('/:id/status', checkAction('employees', 'manage'), setEmployeeStatus);

router.route('/:id')
  .get(getEmployeeById)
  .put(checkAction('employees', 'edit'), updateEmployee)
  .delete(checkAction('employees', 'delete'), deleteEmployee);

module.exports = router;
