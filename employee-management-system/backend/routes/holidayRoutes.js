const express = require('express');
const router = express.Router();
const {
  getHolidays,
  getHolidayById,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} = require('../controllers/holidayController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',    checkPermission('holidays'), getHolidays);
router.get('/:id', checkPermission('holidays'), getHolidayById);
router.post('/',          checkAction('holidays', 'add'),    createHoliday);
router.put('/:id',        checkAction('holidays', 'edit'),   updateHoliday);
router.delete('/:id',     checkAction('holidays', 'delete'), deleteHoliday);

module.exports = router;
