const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment,
} = require('../controllers/departmentController');

// Any authenticated user can list/view departments
router.use(protect);

router.route('/')
  .get(getDepartments)
  .post(adminOnly, createDepartment);

router.route('/:id')
  .get(getDepartmentById)
  .put(adminOnly, updateDepartment)
  .delete(adminOnly, deleteDepartment);

module.exports = router;
