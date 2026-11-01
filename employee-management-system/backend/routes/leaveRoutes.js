const express = require('express');
const router = express.Router();
const { getLeave, getBalances, applyLeave, updateLeaveStatus, cancelLeave } = require('../controllers/leaveController');
const { protect } = require('../middleware/auth');
const { checkAction } = require('../middleware/checkPermission');

router.use(protect);

// ── Self-service / scoped reads (controller scopes by role) ─────────────────
router.get('/',          getLeave);
router.get('/balance',   getBalances);
router.post('/',         checkAction('leave', 'add'),  applyLeave);
router.put('/:id/cancel', cancelLeave);

// ── Approvals require the 'manage' action on the leave module ───────────────
router.put('/:id/status', checkAction('leave', 'manage'), updateLeaveStatus);

module.exports = router;
