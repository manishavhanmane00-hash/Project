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
} = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/auth');

// All employee routes require authentication
router.use(protect);

// Current user's own employee record (employee self-service)
router.get('/me', getMyEmployeeRecord);

router.route('/')
  .get(getEmployees)
  .post(adminOnly, createEmployee);

// Status toggle must come before /:id to avoid route conflict
router.patch('/:id/status', adminOnly, setEmployeeStatus);

router.route('/:id')
  .get(getEmployeeById)
  .put(adminOnly, updateEmployee)
  .delete(adminOnly, deleteEmployee);

module.exports = router;
