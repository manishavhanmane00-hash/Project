const express = require('express');
const router = express.Router();
const { getSalesReport, getInventoryUsage, getOverview } = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect, adminOnly);

router.get('/overview', getOverview);
router.get('/sales', getSalesReport);
router.get('/inventory', getInventoryUsage);

module.exports = router;
