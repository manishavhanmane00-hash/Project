const Employee = require('../models/Employee');
const User     = require('../models/User');

// Normalize incoming employee data — merge firstName/lastName into name, sync designation/position
const normalizeEmployeeData = (body) => {
  const data = { ...body };
  if (!data.name && (data.firstName || data.lastName)) {
    data.name = `${data.firstName || ''} ${data.lastName || ''}`.trim();
  }
  if (!data.designation && data.position) data.designation = data.position;
  if (!data.position && data.designation) data.position = data.designation;
  if (!data.joiningDate && data.dateOfJoining) data.joiningDate = String(data.dateOfJoining).split('T')[0];
  // Never accept client-supplied salary/role escalations through mass assignment silently —
  // salary is allowed but role/userId are stripped explicitly.
  delete data.role;
  delete data.userId;
  return data;
};

/**
 * Generate the next sequential employee ID (EMP-0001, EMP-0002, ...)
 */
const generateEmployeeId = async () => {
  const last = await Employee.findOne({ employeeId: /^EMP-\d+$/ }).sort({ employeeId: -1 });
  let next = 1;
  if (last && last.employeeId) {
    next = parseInt(last.employeeId.split('-')[1], 10) + 1;
  }
  return `EMP-${String(next).padStart(4, '0')}`;
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees?page=&limit=&search=&department=&designation=&status=
//  Employee role: only their own linked record
// ─────────────────────────────────────────────────────────────────────────────
const getEmployees = async (req, res) => {
  try {
    const {
      page = 1, limit = 10, search, department, designation, status,
    } = req.query;

    // Employees can only fetch their own record
    if (req.user.role === 'Employee') {
      const me = await Employee.findOne({ $or: [{ userId: req.user.id }, { email: req.user.email }] });
      return res.json({ success: true, count: me ? 1 : 0, data: me ? [me] : [] });
    }

    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
      filter.$or = [{ name: rx }, { email: rx }, { employeeId: rx }, { phone: rx }];
    }
    if (department) filter.department = department;
    if (designation) filter.designation = designation;
    if (status) filter.status = status;

    const pageNum  = Math.max(1, parseInt(page, 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * pageSize;

    const [employees, total] = await Promise.all([
      Employee.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize),
      Employee.countDocuments(filter),
    ]);

    res.json({
      success: true,
      count: employees.length,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / pageSize),
      data: employees,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees/:id
//  Employee role: can only view their own record
// ─────────────────────────────────────────────────────────────────────────────
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Enforce data isolation for employees
    if (req.user.role === 'Employee') {
      const isOwner = (employee.userId && employee.userId.toString() === req.user.id) || employee.email === req.user.email;
      if (!isOwner) {
        return res.status(403).json({ success: false, message: 'You can only view your own profile' });
      }
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/employees/me  — current user's linked employee record
// ─────────────────────────────────────────────────────────────────────────────
const getMyEmployeeRecord = async (req, res) => {
  try {
    const employee = await Employee.findOne({ $or: [{ userId: req.user.id }, { email: req.user.email }] });
    if (!employee) return res.status(404).json({ success: false, message: 'No employee record linked to your account' });
    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employees  (admin/HR creates an employee record)
//  - auto-generates a unique employee ID
//  - validates duplicate email and employee ID
// ─────────────────────────────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    const data = normalizeEmployeeData(req.body);

    if (!data.email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!data.name) return res.status(400).json({ success: false, message: 'Employee name is required' });
    if (!data.department) return res.status(400).json({ success: false, message: 'Department is required' });

    // Validate duplicate email
    const existing = await Employee.findOne({ email: data.email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
    }

    // Validate duplicate employee ID if supplied
    if (data.employeeId) {
      const idExists = await Employee.findOne({ employeeId: data.employeeId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'An employee with this employee ID already exists' });
      }
    } else {
      data.employeeId = await generateEmployeeId();
    }

    if (!data.joiningDate) data.joiningDate = new Date().toISOString().split('T')[0];

    const employee = await Employee.create(data);

    // If a User account exists with the same email, link them
    await User.findOneAndUpdate(
      { email: data.email.toLowerCase() },
      { employeeRef: employee._id, department: data.department, designation: data.designation || data.position || '' }
    );

    res.status(201).json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An employee with this email or employee ID already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/employees/:id  (admin/HR)
//  Employees update only their own permitted fields via a separate endpoint.
// ─────────────────────────────────────────────────────────────────────────────
const updateEmployee = async (req, res) => {
  try {
    const data = normalizeEmployeeData(req.body);

    // Validate duplicate email if it's being changed
    if (data.email) {
      const existing = await Employee.findOne({ email: data.email.toLowerCase(), _id: { $ne: req.params.id } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
      }
    }

    // Validate duplicate employeeId if it's being changed
    if (data.employeeId) {
      const idExists = await Employee.findOne({ employeeId: data.employeeId, _id: { $ne: req.params.id } });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'An employee with this employee ID already exists' });
      }
    }

    const employee = await Employee.findByIdAndUpdate(req.params.id, data, {
      new: true,
      runValidators: true,
    });
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }

    // Keep the linked User in sync
    await User.findOneAndUpdate(
      { email: employee.email.toLowerCase() },
      { department: employee.department, designation: employee.designation || employee.position || '' }
    );

    res.json({ success: true, data: employee });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'An employee with this email or employee ID already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/employees/:id/status  (admin/HR) — activate/deactivate
// ─────────────────────────────────────────────────────────────────────────────
const setEmployeeStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'on-leave'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be active, inactive, or on-leave' });
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!employee) return res.status(404).json({ success: false, message: 'Employee not found' });

    // Also deactivate the linked User account when employee is set inactive
    if (employee.userId) {
      if (status === 'inactive') {
        await User.findByIdAndUpdate(employee.userId, { isActive: false });
      } else {
        await User.findByIdAndUpdate(employee.userId, { isActive: true });
      }
    }

    res.json({ success: true, data: employee });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/employees/:id  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findByIdAndDelete(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: 'Employee not found' });
    }
    // Unlink the User account (do not delete the login account — that's separate)
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { employeeRef: null });
    }
    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getEmployees,
  getEmployeeById,
  getMyEmployeeRecord,
  createEmployee,
  updateEmployee,
  setEmployeeStatus,
  deleteEmployee,
};
