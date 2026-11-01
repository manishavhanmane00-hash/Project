const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');
const { dashboardMetrics, attendanceReport, leaveReport, employeeReport, departmentReport } = require('../controllers/reportController');

router.use(protect);

// Dashboard metrics power every role's landing dashboard — gated by the
// dashboard module rather than reports.
router.get('/dashboard',   checkPermission('dashboard'), dashboardMetrics);

// Detailed reports require access to the Reports module.
router.get('/attendance',  checkPermission('reports'), attendanceReport);
router.get('/leave',       checkPermission('reports'), leaveReport);
router.get('/employees',   checkPermission('reports'), employeeReport);
router.get('/departments', checkPermission('reports'), departmentReport);

module.exports = router;
