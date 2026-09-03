const express = require('express');
const router = express.Router();
const { parseUserInfo, requireAdmin, requireAuth } = require('../middleware/aiAuth');
const {
  adminChat,
  adminInsights,
  attendanceAnalysis,
  leaveSummary,
  payrollInsights,
  performanceSummary,
  generateReport,
  employeeChat,
  employeeWeeklySummary,
  policyChat,
} = require('../controllers/aiController');

// All AI routes require authentication (X-User-Info header)
router.use(parseUserInfo);

// ── Admin-only AI routes ──────────────────────────────────────────────────
router.post('/admin/chat',               requireAdmin, adminChat);
router.post('/admin/insights',           requireAdmin, adminInsights);
router.post('/admin/attendance-analysis',requireAdmin, attendanceAnalysis);
router.post('/admin/leave-summary',      requireAdmin, leaveSummary);
router.post('/admin/payroll-insights',   requireAdmin, payrollInsights);
router.post('/admin/performance-summary',requireAdmin, performanceSummary);
router.post('/admin/generate-report',    requireAdmin, generateReport);

// ── Employee AI routes (any authenticated user) ───────────────────────────
router.post('/employee/chat',            requireAuth, employeeChat);
router.post('/employee/weekly-summary',  requireAuth, employeeWeeklySummary);

// ── Company policy Q&A (admin + employee) ────────────────────────────────
router.post('/policy',                   requireAuth, policyChat);

module.exports = router;
