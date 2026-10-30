const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { dashboardMetrics, attendanceReport, leaveReport, employeeReport, departmentReport } = require('../controllers/reportController');

router.use(protect);

router.get('/dashboard',   dashboardMetrics);
router.get('/attendance',  attendanceReport);
router.get('/leave',       leaveReport);
router.get('/employees',   adminOnly, employeeReport);
router.get('/departments', adminOnly, departmentReport);

module.exports = router;
