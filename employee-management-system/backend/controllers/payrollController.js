const Payroll = require('../models/Payroll');
const Notification = require('../models/Notification');
const User = require('../models/User');
const Overtime = require('../models/Overtime');
const Advance = require('../models/Advance');
const { overtimeEarningsFor } = require('../services/overtimePayroll');
const { advanceDeductionsFor } = require('../services/advancePayroll');

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

      const numericYear = Number(year);

      // --- Collect additive overtime earnings & advance deductions (pure logic) ---
      // Query this employee's qualifying bookkeeping records, compute contributions
      // via the pure services, then mark the contributing entries so each is counted
      // at most once (Req 9.4, 11.2/11.3). The marks are captured first so they can be
      // reverted to the pre-generation state if the payroll upsert throws (Req 9.5).
      const overtimeEntries = await Overtime.find({ employeeId, status: 'Pending', counted: false });
      const advanceRecords = await Advance.find({ employeeId, status: 'Salary Adjustment', deducted: false });

      const { amount: overtimeEarnings, entryIds: countedOvertimeIds } =
        overtimeEarningsFor(overtimeEntries.map((e) => e.toObject()), month, numericYear);
      const { amount: advanceDeductions, recordIds: deductedAdvanceIds } =
        advanceDeductionsFor(advanceRecords.map((r) => r.toObject()), month, numericYear);

      // Track what was marked in this iteration so we can revert on failure.
      const markedOvertimeIds = [];
      const markedAdvanceIds = [];

      try {
        // Mark contributing overtime entries as counted for this month/year.
        for (const id of countedOvertimeIds) {
          await Overtime.updateOne(
            { _id: id },
            { counted: true, countedMonth: month, countedYear: numericYear }
          );
          markedOvertimeIds.push(id);
        }
        // Mark contributing advance records as deducted for this month/year.
        for (const id of deductedAdvanceIds) {
          await Advance.updateOne(
            { _id: id },
            { deducted: true, deductedMonth: month, deductedYear: numericYear }
          );
          markedAdvanceIds.push(id);
        }

        const record = await Payroll.findOneAndUpdate(
          { employeeId, month, year: numericYear },
          { employeeId, employeeName, email, department, month, year: numericYear, basic: basic || 0, hra: hra || 0, allowances: allowances || 0, bonus: bonus || 0, tax: tax || 0, insurance: insurance || 0, otherDeductions: otherDeductions || 0, overtimeEarnings, advanceDeductions, paymentDate: paymentDate || null, status: 'pending' },
          { upsert: true, new: true }
        );
        results.push(record);
      } catch (itemErr) {
        // Revert the marks made in this iteration back to the pre-generation state
        // so no overtime/advance is excluded from a later successful generation (Req 9.5).
        for (const id of markedOvertimeIds) {
          await Overtime.updateOne(
            { _id: id },
            { counted: false, countedMonth: null, countedYear: null }
          );
        }
        for (const id of markedAdvanceIds) {
          await Advance.updateOne(
            { _id: id },
            { deducted: false, deductedMonth: null, deductedYear: null }
          );
        }
        throw itemErr;
      }

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
