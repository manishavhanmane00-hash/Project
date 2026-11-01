const express = require('express');
const router = express.Router();
const {
  getOvertime,
  createOvertime,
  updateOvertime,
  settleOvertime,
  deleteOvertime,
} = require('../controllers/overtimeController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',             checkPermission('overtime.records'),    getOvertime);
router.post('/',            checkAction('overtime', 'add'),         createOvertime);
router.put('/:id',          checkAction('overtime', 'edit'),        updateOvertime);
router.put('/:id/settle',   checkAction('overtime', 'manage'),      settleOvertime);
router.delete('/:id',       checkAction('overtime', 'delete'),      deleteOvertime);

module.exports = router;
