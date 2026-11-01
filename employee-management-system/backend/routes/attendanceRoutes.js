const express = require('express');
const router = express.Router();
const {
  getAttendance, markAttendance, selfMarkAttendance,
  checkIn, checkOut, correctAttendance, mySummary,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

// ── Self-service (any authenticated user; controller scopes to the caller) ──
router.post('/check-in',    checkIn);
router.put('/check-out',    checkOut);
router.post('/self',        selfMarkAttendance);
router.get('/my-summary',   mySummary);

// ── Module-gated routes ─────────────────────────────────────────────────────
router.get('/',            checkPermission('attendance'), getAttendance);
router.post('/',           checkAction('attendance', 'add'),    markAttendance);
router.put('/:id/correct', checkAction('attendance', 'edit'),   correctAttendance);

module.exports = router;
