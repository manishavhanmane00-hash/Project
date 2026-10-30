const Advance = require('../models/Advance');
const { isValidAdvanceAmount } = require('../services/advancePayroll');

// Allowed values mirror the Advance model enums.
const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank'];
// Statuses an admin/HR user may set via update (Req 10.7). "Pending" remains
// the create-time default and is not an allowed update target here.
const UPDATABLE_STATUSES = ['Pending', 'Settled/Returned', 'Salary Adjustment'];

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/advances  (admin/HR: all; employee: own)
// ─────────────────────────────────────────────────────────────────────────────
const getAdvances = async (req, res) => {
  try {
    const { status, employeeId, paymentMethod } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else if (employeeId) {
      filter.employeeId = employeeId;
    }
    if (status) filter.status = status;
    if (paymentMethod) filter.paymentMethod = paymentMethod;

    const records = await Advance.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/advances/:id
// ─────────────────────────────────────────────────────────────────────────────
const getAdvance = async (req, res) => {
  try {
    const record = await Advance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Advance record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/advances  (admin/HR gives an advance)
//  - validates amount > 0 (Req 10.5)
//  - status defaults to "Pending" (Req 10.6)
// ─────────────────────────────────────────────────────────────────────────────
const createAdvance = async (req, res) => {
  try {
    const { employeeId, userId, email, employeeName, date, amount, paymentMethod, reason } = req.body;

    if (!employeeId) {
      return res.status(400).json({ success: false, message: 'employeeId is required' });
    }
    if (!date) {
      return res.status(400).json({ success: false, message: 'date is required' });
    }
    if (!isValidAdvanceAmount(amount)) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }
    if (paymentMethod && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`,
      });
    }

    const record = await Advance.create({
      employeeId,
      userId: userId || null,
      email: email || '',
      employeeName: employeeName || '',
      date,
      amount: Number(amount),
      paymentMethod: paymentMethod || 'Cash',
      reason: (reason || '').trim(),
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/advances/:id  (admin/HR updates record / sets status)
//  - allows setting status to Settled/Returned or Salary Adjustment (Req 10.7)
// ─────────────────────────────────────────────────────────────────────────────
const updateAdvance = async (req, res) => {
  try {
    const record = await Advance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Advance record not found' });

    const { employeeId, userId, email, employeeName, date, amount, paymentMethod, reason, status } = req.body;

    if (amount !== undefined && !isValidAdvanceAmount(amount)) {
      return res.status(400).json({ success: false, message: 'Amount must be greater than zero' });
    }
    if (paymentMethod !== undefined && !PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: `paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`,
      });
    }
    if (status !== undefined && !UPDATABLE_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `status must be one of: ${UPDATABLE_STATUSES.join(', ')}`,
      });
    }

    if (employeeId !== undefined) record.employeeId = employeeId;
    if (userId !== undefined) record.userId = userId;
    if (email !== undefined) record.email = email;
    if (employeeName !== undefined) record.employeeName = employeeName;
    if (date !== undefined) record.date = date;
    if (amount !== undefined) record.amount = Number(amount);
    if (paymentMethod !== undefined) record.paymentMethod = paymentMethod;
    if (reason !== undefined) record.reason = (reason || '').trim();
    if (status !== undefined) record.status = status;

    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/advances/:id  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const deleteAdvance = async (req, res) => {
  try {
    const record = await Advance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Advance record not found' });

    await record.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getAdvances,
  getAdvance,
  createAdvance,
  updateAdvance,
  deleteAdvance,
};
