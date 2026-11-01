const express = require('express');
const router = express.Router();
const {
  getAdvances,
  getAdvance,
  createAdvance,
  updateAdvance,
  deleteAdvance,
} = require('../controllers/advanceController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',        checkPermission('advances.records'), getAdvances);
router.get('/:id',     checkPermission('advances.records'), getAdvance);
router.post('/',       checkAction('advances', 'add'),    createAdvance);
router.put('/:id',     checkAction('advances', 'edit'),   updateAdvance);
router.delete('/:id',  checkAction('advances', 'delete'), deleteAdvance);

module.exports = router;
