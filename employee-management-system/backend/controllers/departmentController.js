const Department = require('../models/Department');
const Employee   = require('../models/Employee');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/departments  — list all departments with employee counts
// ─────────────────────────────────────────────────────────────────────────────
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();

    // Compute live employee counts from the Employee collection
    const counts = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    const countMap = counts.reduce((m, c) => { m[c._id] = c.count; return m; }, {});

    departments.forEach(d => { d.employeeCount = countMap[d.name] || 0; });

    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/departments/:id
// ─────────────────────────────────────────────────────────────────────────────
const getDepartmentById = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });
    const employeeCount = await Employee.countDocuments({ department: dept.name });
    res.json({ success: true, data: { ...dept.toObject(), employeeCount } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/departments  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const createDepartment = async (req, res) => {
  try {
    const { name, code, description, manager } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Department name is required' });
    }

    const exists = await Department.findOne({ name: name.trim() });
    if (exists) {
      return res.status(400).json({ success: false, message: 'A department with this name already exists' });
    }

    const dept = await Department.create({
      name: name.trim(),
      code: (code || '').trim().toUpperCase(),
      description: (description || '').trim(),
      manager: (manager || '').trim(),
    });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ success: false, message: 'A department with this name already exists' });
    }
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/departments/:id  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const updateDepartment = async (req, res) => {
  try {
    const { name, code, description, manager, status } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (code !== undefined) updates.code = code.trim().toUpperCase();
    if (description !== undefined) updates.description = description.trim();
    if (manager !== undefined) updates.manager = manager.trim();
    if (status !== undefined) updates.status = status;

    const oldDept = await Department.findById(req.params.id);
    if (!oldDept) return res.status(404).json({ success: false, message: 'Department not found' });

    // If renaming the department, propagate the new name to all employees in it
    if (name && name.trim() !== oldDept.name) {
      const newName = name.trim();
      const dup = await Department.findOne({ name: newName, _id: { $ne: req.params.id } });
      if (dup) {
        return res.status(400).json({ success: false, message: 'A department with this name already exists' });
      }
      await Employee.updateMany({ department: oldDept.name }, { $set: { department: newName } });
    }

    const dept = await Department.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    res.json({ success: true, data: dept });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/departments/:id  (admin/HR)
// Prevents deletion when employees are still assigned — unless reassigned.
// ─────────────────────────────────────────────────────────────────────────────
const deleteDepartment = async (req, res) => {
  try {
    const dept = await Department.findById(req.params.id);
    if (!dept) return res.status(404).json({ success: false, message: 'Department not found' });

    const empCount = await Employee.countDocuments({ department: dept.name });
    if (empCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete "${dept.name}" — ${empCount} employee(s) are still assigned. Reassign them first.`,
        employeeCount: empCount,
      });
    }

    // Safe — no employees reference this department
    await Department.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Department deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getDepartments, getDepartmentById, createDepartment, updateDepartment, deleteDepartment };
