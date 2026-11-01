const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkAction } = require('../middleware/checkPermission');
const {
  getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment,
} = require('../controllers/departmentController');

router.use(protect);

// Reads stay open to any authenticated user: department lists feed form dropdowns
// (e.g. Add Employee) across the app regardless of the Departments module toggle.
router.route('/')
  .get(getDepartments)
  .post(checkAction('departments', 'add'), createDepartment);

router.route('/:id')
  .get(getDepartmentById)
  .put(checkAction('departments', 'edit'), updateDepartment)
  .delete(checkAction('departments', 'delete'), deleteDepartment);

module.exports = router;
