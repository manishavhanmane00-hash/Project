const express = require('express');
const router = express.Router();
const { getLeave, applyLeave, updateLeaveStatus } = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getLeave);
router.post('/', applyLeave);
router.put('/:id/status', adminOnly, updateLeaveStatus);

module.exports = router;
