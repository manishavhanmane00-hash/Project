const express = require('express');
const router = express.Router();
const { getAttendance, markAttendance, checkIn, checkOut } = require('../controllers/attendanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getAttendance);
router.post('/', adminOnly, markAttendance);
router.post('/check-in', checkIn);
router.put('/check-out', checkOut);

module.exports = router;
