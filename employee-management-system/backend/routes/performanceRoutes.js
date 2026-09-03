const express = require('express');
const router = express.Router();
const { getPerformance, createReview, updateReview } = require('../controllers/performanceController');
const { protect, adminOnly } = require('../middleware/auth');

router.use(protect);

router.get('/', getPerformance);
router.post('/', adminOnly, createReview);
router.put('/:id', adminOnly, updateReview);

module.exports = router;
