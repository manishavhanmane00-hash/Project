const express = require('express');
const router = express.Router();
const { getPayroll, generatePayroll, approvePayroll } = require('../controllers/payrollController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getPayroll);
router.post('/', adminOnly, generatePayroll);
router.put('/:id/approve', adminOnly, approvePayroll);

module.exports = router;
