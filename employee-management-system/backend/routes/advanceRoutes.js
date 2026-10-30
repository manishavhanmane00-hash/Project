const express = require('express');
const router = express.Router();
const {
  getAdvances,
  getAdvance,
  createAdvance,
  updateAdvance,
  deleteAdvance,
} = require('../controllers/advanceController');
const { protect, adminOnly } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',        checkPermission('advances.records'), getAdvances);
router.get('/:id',     checkPermission('advances.records'), getAdvance);
router.post('/',       adminOnly, checkAction('advances', 'add'),    createAdvance);
router.put('/:id',     adminOnly, checkAction('advances', 'edit'),   updateAdvance);
router.delete('/:id',  adminOnly, checkAction('advances', 'delete'), deleteAdvance);

module.exports = router;
