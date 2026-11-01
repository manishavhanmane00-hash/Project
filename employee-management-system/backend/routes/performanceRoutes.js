const express = require('express');
const router = express.Router();
const { getPerformance, createReview, updateReview } = require('../controllers/performanceController');
const { protect } = require('../middleware/auth');
const { checkPermission, checkAction } = require('../middleware/checkPermission');

router.use(protect);

router.get('/',    checkPermission('performance'),        getPerformance);
router.post('/',   checkAction('performance', 'add'),     createReview);
router.put('/:id', checkAction('performance', 'edit'),    updateReview);

module.exports = router;
