const express = require('express');
const router = express.Router();
const {
  getAttendance, markAttendance, selfMarkAttendance,
  checkIn, checkOut, correctAttendance, mySummary,
} = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

// Employee routes (must come before /:id to avoid conflicts)
router.post('/check-in',    checkIn);
router.put('/check-out',    checkOut);
router.post('/self',         selfMarkAttendance);
router.get('/my-summary',   mySummary);

// Admin/HR routes
router.get('/',             getAttendance);
router.post('/',            adminOnly, markAttendance);
router.put('/:id/correct',  adminOnly, correctAttendance);

module.exports = router;
