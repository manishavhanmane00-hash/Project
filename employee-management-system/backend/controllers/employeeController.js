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
 * Generate the next sequential employee ID (EMP-0001, EMP-0002, ...).
 * Scans the highest existing numeric suffix across BOTH Employee and User
 * collections so IDs never collide, even if a login account exists without a
 * matching employee record (or vice versa).
 */
const generateEmployeeId = async () => {
  const parseMax = (docs) => docs.reduce((max, d) => {
    const m = /^EMP-(\d+)$/.exec(d.employeeId || '');
    return m ? Math.max(max, parseInt(m[1], 10)) : max;
  }, 0);

  const [empLast, userLast] = await Promise.all([
    Employee.findOne({ employeeId: /^EMP-\d+$/ }).sort({ employeeId: -1 }),
    User.findOne({ employeeId: /^EMP-\d+$/ }).sort({ employeeId: -1 }),
  ]);

  const next = parseMax([empLast, userLast].filter(Boolean)) + 1;
  return `EMP-${String(next).padStart(4, '0')}`;
};

/**
 * Generate a unique employee ID, retrying if a concurrent create grabbed the
 * same number. Guards against the (rare) race between read and write.
 */
const generateUniqueEmployeeId = async () => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = await generateEmployeeId();
    const [empExists, userExists] = await Promise.all([
      Employee.exists({ employeeId: candidate }),
      User.exists({ employeeId: candidate }),
    ]);
    if (!empExists && !userExists) return candidate;
  }
  // Fallback: timestamp-based ID guaranteed unique
  return `EMP-${Date.now().toString().slice(-8)}`;
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

    // Exclude drafts from the main employee list — they live in a separate resume list.
    const filter = { isDraft: { $ne: true } };
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
// Draft helpers
// A draft is a partially-filled, not-yet-finalized employee record. It is owned
// by the user who created it (createdBy) so it survives refresh/logout/login and
// can be resumed from the step the user left off on. No User login account is
// created for a draft — that only happens when the draft is finalized.
// ─────────────────────────────────────────────────────────────────────────────

// Fields that are safe to persist on a draft (everything the form collects).
const sanitizeDraftData = (body) => {
  const data = normalizeEmployeeData(body); // strips role/userId, merges name/designation
  // Never store login credentials on the draft document.
  delete data.password;
  delete data.confirmPassword;
  delete data.loginRole;
  // Keep loginRole as plain metadata so the form can restore the selection.
  if (['Employee', 'Manager', 'HR'].includes(body.loginRole)) {
    data.loginRole = body.loginRole;
  }
  return data;
};

// GET /api/employees/drafts — list the current user's drafts (newest first)
const getDrafts = async (req, res) => {
  try {
    const drafts = await Employee.find({ isDraft: true, createdBy: req.user.id })
      .sort({ updatedAt: -1 });
    res.json({ success: true, count: drafts.length, data: drafts });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// GET /api/employees/drafts/:id — fetch a single draft the user owns
const getDraftById = async (req, res) => {
  try {
    const draft = await Employee.findOne({ _id: req.params.id, isDraft: true, createdBy: req.user.id });
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    res.json({ success: true, data: draft });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// POST /api/employees/drafts        — create a new draft
// PUT  /api/employees/drafts/:id    — update an existing draft
// Relaxed validation: a draft can be saved with any subset of fields filled.
const saveDraft = async (req, res) => {
  try {
    const data = sanitizeDraftData(req.body);
    data.isDraft = true;
    data.createdBy = req.user.id;
    data.draftStep = Number(req.body.draftStep) || 1;
    // Drafts must never carry an employeeId (that is assigned only on finalize).
    delete data.employeeId;
    // Blank email → store undefined so it won't collide on the partial unique index.
    if (!data.email) delete data.email;

    const draftId = req.params.id;
    let draft;
    if (draftId) {
      draft = await Employee.findOne({ _id: draftId, isDraft: true, createdBy: req.user.id });
      if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
      // If email was cleared, unset it on the stored document.
      if (!data.email) draft.email = undefined;
      Object.assign(draft, data);
      await draft.save();
    } else {
      draft = await Employee.create(data);
    }

    res.status(draftId ? 200 : 201).json({ success: true, data: draft });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'A record with this email already exists' });
    }
    res.status(400).json({ success: false, message: error.message });
  }
};

// DELETE /api/employees/drafts/:id — discard a draft the user owns
const deleteDraft = async (req, res) => {
  try {
    const draft = await Employee.findOneAndDelete({ _id: req.params.id, isDraft: true, createdBy: req.user.id });
    if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });
    res.json({ success: true, message: 'Draft discarded' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/employees  (admin/HR creates an employee record)
//  - auto-generates a unique employee ID
//  - validates duplicate email and employee ID
//  - when `draftId` is supplied, promotes that draft into a finalized employee
// ─────────────────────────────────────────────────────────────────────────────
const createEmployee = async (req, res) => {
  try {
    // Pull out login-account fields BEFORE normalizing (which strips them).
    const initialPassword = req.body.password;
    const loginRole = ['Employee', 'Manager', 'HR'].includes(req.body.loginRole)
      ? req.body.loginRole
      : 'Employee';
    const draftId = req.body.draftId;

    const data = normalizeEmployeeData(req.body);
    // Never persist password/loginRole/draft metadata onto the Employee document.
    delete data.password;
    delete data.loginRole;
    delete data.draftId;
    delete data.isDraft;
    delete data.draftStep;
    delete data.createdBy;

    if (!data.email) return res.status(400).json({ success: false, message: 'Email is required' });
    if (!data.name) return res.status(400).json({ success: false, message: 'Employee name is required' });
    if (!data.department) return res.status(400).json({ success: false, message: 'Department is required' });

    // Validate the initial login password when supplied
    if (initialPassword !== undefined && initialPassword !== '' && String(initialPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Initial password must be at least 6 characters' });
    }

    const emailLower = data.email.toLowerCase();

    // Validate duplicate email on the Employee collection. When finalizing a
    // draft, exclude that draft from the check — its stored email is the one we
    // are promoting, not a genuine duplicate.
    const dupFilter = { email: emailLower };
    if (draftId) dupFilter._id = { $ne: draftId };
    const existing = await Employee.findOne(dupFilter);
    if (existing) {
      return res.status(400).json({ success: false, message: 'An employee with this email already exists' });
    }

    // Validate duplicate employee ID if supplied, otherwise auto-generate a unique one
    if (data.employeeId) {
      const idExists = await Employee.findOne({ employeeId: data.employeeId });
      if (idExists) {
        return res.status(400).json({ success: false, message: 'An employee with this employee ID already exists' });
      }
    } else {
      data.employeeId = await generateUniqueEmployeeId();
    }

    if (!data.joiningDate) data.joiningDate = new Date().toISOString().split('T')[0];

    // Finalize: if a draftId is supplied, convert that existing draft document
    // in place (so its email never collides with a freshly-created record on
    // the partial unique index). Otherwise create a brand-new employee.
    let employee;
    if (draftId) {
      employee = await Employee.findOne({ _id: draftId, isDraft: true, createdBy: req.user.id });
      if (!employee) {
        return res.status(404).json({ success: false, message: 'Draft not found or already finalized' });
      }
      Object.assign(employee, data);
      employee.isDraft = false;
      employee.draftStep = undefined;
      await employee.save();
    } else {
      employee = await Employee.create(data);
    }

    // ── Create or link the login (User) account ───────────────────────────────
    // An employee logs in with their Employee ID + the password set here.
    let loginAccount = await User.findOne({ email: emailLower });

    if (loginAccount) {
      // An account already exists for this email — link it and stamp the Employee ID.
      loginAccount.employeeRef  = employee._id;
      loginAccount.employeeId   = loginAccount.employeeId || employee.employeeId;
      loginAccount.department   = data.department;
      loginAccount.designation  = data.designation || data.position || '';
      if (initialPassword) {
        loginAccount.password = initialPassword;         // hashed by pre-save hook
        loginAccount.mustChangePassword = true;
      }
      await loginAccount.save();
    } else {
      // Create a brand-new Employee login account keyed by Employee ID.
      // If no password was provided, generate a strong random one (HR can reset later).
      const pwd = initialPassword && String(initialPassword).length >= 6
        ? initialPassword
        : require('crypto').randomBytes(24).toString('hex');

      loginAccount = await User.create({
        name:        data.name,
        email:       emailLower,
        employeeId:  employee.employeeId,
        password:    pwd,                 // hashed by pre-save hook
        role:        loginRole,
        department:  data.department,
        designation: data.designation || data.position || '',
        phone:       data.phone || '',
        employeeRef: employee._id,
        mustChangePassword: Boolean(initialPassword), // only prompt if HR set a known password
        isActive:    true,
      });
    }

    // Link the employee record back to the login account
    employee.userId = loginAccount._id;
    await employee.save();

    res.status(201).json({
      success: true,
      data: employee,
      account: {
        employeeId: employee.employeeId,
        email: emailLower,
        role: loginAccount.role,
        hasPassword: Boolean(initialPassword),
      },
    });
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
    // Deactivate and unlink the associated login account so a deleted employee
    // can no longer sign in, without hard-deleting their audit trail.
    if (employee.userId) {
      await User.findByIdAndUpdate(employee.userId, { employeeRef: null, isActive: false });
    } else {
      // Fall back to matching by email if the link was never set
      await User.findOneAndUpdate({ email: employee.email?.toLowerCase() }, { employeeRef: null, isActive: false });
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
  getDrafts,
  getDraftById,
  saveDraft,
  deleteDraft,
};
