const express = require('express');
const router = express.Router();
const {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} = require('../controllers/employeeController');
const { protect, adminOnly } = require('../middleware/auth');

// All employee routes require authentication
router.use(protect);

// Admin/HR/Manager can list and create employees; protected read for all authenticated
router.route('/')
  .get(getEmployees)
  .post(adminOnly, createEmployee);

router.route('/:id')
  .get(getEmployeeById)
  .put(adminOnly, updateEmployee)
  .delete(adminOnly, deleteEmployee);

module.exports = router;
