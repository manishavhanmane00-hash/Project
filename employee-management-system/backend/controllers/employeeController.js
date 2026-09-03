const Employee = require('../models/Employee');
const User = require('../models/User');

// Normalize incoming employee data — merge firstName/lastName into name, sync designation/position
const normalizeEmployeeData = (body) => {
  const data = { ...body };

  // Build name from parts if not provided directly
  if (!data.name && (data.firstName || data.lastName)) {
    data.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  }

  // Sync designation / position aliases
  if (!data.designation && data.position) data.designation = data.position;
  if (!data.position && data.designation) data.position = data.designation;

  // joiningDate: accept both field names
  if (!data.joiningDate && data.dateOfJoining) data.joiningDate = String(data.dateOfJoining).split('T')[0];

  return data;
};

// GET /api/employees
const getEmployees = async (req, res) => {
  try {
    const employees = await Employee.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: employees.length, data: employees });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/:id
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees  (admin creates an employee record)
const createEmployee = async (req, res) => {
  try {
    const data = normalizeEmployeeData(req.body);

    // require email + name + department
    if (!data.email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!data.name) return res.status(400).json({ success: false, message: 'Employee name is required' });
    if (!data.department) return res.status(400).json({ success: false, message: 'Department is required' });

    const employee = await Employee.create(data);
    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// PUT /api/employees/:id
const updateEmployee = async (req, res) => {
  try {
    const data = normalizeEmployeeData(req.body);

    const employee = await Employee.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/employees/:id
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    res.status(200).json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
};
