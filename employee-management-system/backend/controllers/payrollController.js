const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/payroll  (admin: all; employee: own)
const getPayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
    }
    if (month) filter.month = month;
    if (year)  filter.year  = Number(year);

    const records = await Payroll.find(filter).sort({ year: -1, createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/payroll  (admin generates payroll for one or more employees)
const generatePayroll = async (req, res) => {
  try {
    const records = Array.isArray(req.body) ? req.body : [req.body];
    const results = [];

    for (const item of records) {
      const { employeeId, employeeName, email, department, month, year, basic, hra, allowances, bonus, tax, insurance, otherDeductions, paymentDate } = item;
      if (!employeeId || !month || !year) continue;

      const record = await Payroll.findOneAndUpdate(
        { employeeId, month, year: Number(year) },
        { employeeId, employeeName, email, department, month, year: Number(year), basic: basic || 0, hra: hra || 0, allowances: allowances || 0, bonus: bonus || 0, tax: tax || 0, insurance: insurance || 0, otherDeductions: otherDeductions || 0, paymentDate: paymentDate || null, status: 'pending' },
        { upsert: true, new: true }
      );
      results.push(record);

      // Notify employee
      const empUser = await User.findOne({ $or: [{ _id: employeeId }, { email }] }).select('_id');
      if (empUser) {
        await Notification.create({
          userId: empUser._id,
          employeeId,
          title: 'Payslip Generated',
          message: `Your payslip for ${month} ${year} has been generated`,
          type: 'payroll',
        });
      }
    }

    res.status(201).json({ success: true, count: results.length, data: results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/payroll/:id/approve  (admin approves payroll)
const approvePayroll = async (req, res) => {
  try {
    const record = await Payroll.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true });
    if (!record) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getPayroll, generatePayroll, approvePayroll };
