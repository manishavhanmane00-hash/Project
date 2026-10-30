const express = require('express');
const router = express.Router();
const { getProfile, updateProfile, changePassword, getUsers } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.patch('/me/password', changePassword);
router.get('/', adminOnly, getUsers);

module.exports = router;
