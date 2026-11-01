const express = require('express');
const router = express.Router();
const { getPayroll, generatePayroll, approvePayroll } = require('../controllers/payrollController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',             checkPermission('payroll'),          getPayroll);
router.post('/',            checkAction('payroll', 'add'),       generatePayroll);
router.put('/:id/approve',  checkAction('payroll', 'manage'),    approvePayroll);

module.exports = router;
