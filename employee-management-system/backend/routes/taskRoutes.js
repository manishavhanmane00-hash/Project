const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const { getTasks, createTask, updateTask, deleteTask } = require('../controllers/taskController');

router.use(protect);

router.route('/')
  .get(getTasks)
  .post(adminOnly, createTask);

router.route('/:id')
  .put(updateTask)
  .delete(adminOnly, deleteTask);

module.exports = router;
