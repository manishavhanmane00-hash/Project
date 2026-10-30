const Task = require('../models/Task');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/tasks
//  Admin/HR: all tasks (optional filters by assignedTo, status, department)
//  Employee: only tasks assigned to them
// ─────────────────────────────────────────────────────────────────────────────
const getTasks = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter['assignedTo.userId'] = req.user.id;
    } else {
      if (userId) filter['assignedTo.userId'] = userId;
    }
    if (status) filter.status = status;

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: tasks.length, data: tasks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/tasks  (admin/HR assigns a task)
// ─────────────────────────────────────────────────────────────────────────────
const createTask = async (req, res) => {
  try {
    const { title, description, assignedToUserId, assignedToName, assignedToEmail, department, priority, dueDate } = req.body;

    if (!title || !assignedToUserId) {
      return res.status(400).json({ success: false, message: 'Title and assignedToUserId are required' });
    }

    const task = await Task.create({
      title: title.trim(),
      description: (description || '').trim(),
      assignedTo: {
        userId: assignedToUserId,
        name: assignedToName || '',
        email: assignedToEmail || '',
      },
      assignedBy: { userId: req.user.id, name: req.user.name },
      department: department || req.user.department || '',
      priority: priority || 'medium',
      dueDate: dueDate || null,
      status: 'todo',
    });

    res.status(201).json({ success: true, data: task });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/tasks/:id  — update a task
//  Admin/HR: full edit
//  Employee: can only update status (and optionally notes)
// ─────────────────────────────────────────────────────────────────────────────
const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });

    if (req.user.role === 'Employee') {
      // Employees can only touch tasks assigned to them, and only the status
      if (task.assignedTo.userId.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'You can only update tasks assigned to you' });
      }
      const { status, notes } = req.body;
      if (status) {
        task.status = status;
        if (status === 'completed') task.completedAt = new Date();
        else task.completedAt = null;
      }
      if (notes !== undefined) task.notes = notes;
    } else {
      // Admin/HR full edit
      ['title', 'description', 'priority', 'dueDate', 'status', 'notes', 'department'].forEach(k => {
        if (req.body[k] !== undefined) task[k] = req.body[k];
      });
      if (req.body.assignedToUserId) {
        task.assignedTo = {
          userId: req.body.assignedToUserId,
          name: req.body.assignedToName || task.assignedTo.name || '',
          email: req.body.assignedToEmail || task.assignedTo.email || '',
        };
      }
      if (req.body.status === 'completed' && !task.completedAt) task.completedAt = new Date();
      if (req.body.status && req.body.status !== 'completed') task.completedAt = null;
    }

    const updated = await task.save();
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/tasks/:id  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    res.json({ success: true, message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getTasks, createTask, updateTask, deleteTask };
