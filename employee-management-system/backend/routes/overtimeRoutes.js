const express = require('express');
const router = express.Router();
const {
  getOvertime,
  createOvertime,
  updateOvertime,
  settleOvertime,
  deleteOvertime,
} = require('../controllers/overtimeController');
const { protect, adminOnly } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',             checkPermission('overtime.records'), getOvertime);
router.post('/',            adminOnly, checkAction('overtime', 'add'),    createOvertime);
router.put('/:id',          adminOnly, checkAction('overtime', 'edit'),   updateOvertime);
router.put('/:id/settle',   adminOnly, checkAction('overtime', 'manage'), settleOvertime);
router.delete('/:id',       adminOnly, checkAction('overtime', 'delete'), deleteOvertime);

module.exports = router;
