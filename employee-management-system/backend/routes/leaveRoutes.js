const express = require('express');
const router = express.Router();
const { getLeave, getBalances, applyLeave, updateLeaveStatus, cancelLeave } = require('../controllers/leaveController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/',         getLeave);
router.get('/balance',  getBalances);
router.post('/',         applyLeave);
router.put('/:id/status', adminOnly, updateLeaveStatus);
router.put('/:id/cancel', cancelLeave);

module.exports = router;
