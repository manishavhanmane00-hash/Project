const Overtime = require('../models/Overtime');
const { overtimeAmount, isValidOvertimeInput } = require('../services/overtimePayroll');

// ─────────────────────────────────────────────────────────────────────────────
// Validation message for rejected overtime input (Req 8.5).
// ─────────────────────────────────────────────────────────────────────────────
const INVALID_INPUT_MESSAGE =
  'Invalid overtime: at least one of durationHours or durationMinutes must be greater than 0, and ratePerHour must be non-negative.';

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/overtime  (admin/HR: all; employee: own via userId or email)
// ─────────────────────────────────────────────────────────────────────────────
const getOvertime = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
    }
    if (status) filter.status = status;

    const records = await Overtime.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/overtime  (admin/HR logs overtime)
//  - validates via the pure overtime predicate
//  - computes totalAmount = (hours + minutes/60) * ratePerHour
//  - sets status "Pending"
// ─────────────────────────────────────────────────────────────────────────────
const createOvertime = async (req, res) => {
  try {
    const {
      employeeId, userId, email, employeeName, date,
      durationHours, durationMinutes, ratePerHour, reason,
    } = req.body;

    if (!employeeId || !date) {
      return res.status(400).json({ success: false, message: 'employeeId and date are required' });
    }

    if (!isValidOvertimeInput({ durationHours, durationMinutes, ratePerHour })) {
      return res.status(400).json({ success: false, message: INVALID_INPUT_MESSAGE });
    }

    const hours   = Number(durationHours) || 0;
    const minutes = Number(durationMinutes) || 0;
    const rate    = Number(ratePerHour);

    const entry = await Overtime.create({
      employeeId,
      userId:       userId || null,
      email:        email || '',
      employeeName: employeeName || '',
      date,
      durationHours:   hours,
      durationMinutes: minutes,
      ratePerHour:     rate,
      totalAmount:     overtimeAmount(hours, minutes, rate),
      reason: (reason || '').trim(),
      status: 'Pending',
    });

    res.status(201).json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/overtime/:id  (admin/HR updates an entry; recomputes totalAmount)
// ─────────────────────────────────────────────────────────────────────────────
const updateOvertime = async (req, res) => {
  try {
    const entry = await Overtime.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Overtime entry not found' });

    const {
      employeeId, userId, email, employeeName, date,
      durationHours, durationMinutes, ratePerHour, reason, status,
    } = req.body;

    // Resolve the effective duration/rate (new value when provided, else existing)
    const hours = durationHours   !== undefined ? Number(durationHours) || 0   : entry.durationHours;
    const minutes = durationMinutes !== undefined ? Number(durationMinutes) || 0 : entry.durationMinutes;
    const rate  = ratePerHour     !== undefined ? Number(ratePerHour)          : entry.ratePerHour;

    if (!isValidOvertimeInput({ durationHours: hours, durationMinutes: minutes, ratePerHour: rate })) {
      return res.status(400).json({ success: false, message: INVALID_INPUT_MESSAGE });
    }

    if (employeeId !== undefined)   entry.employeeId = employeeId;
    if (userId !== undefined)       entry.userId = userId || null;
    if (email !== undefined)        entry.email = email;
    if (employeeName !== undefined) entry.employeeName = employeeName;
    if (date !== undefined)         entry.date = date;
    if (reason !== undefined)       entry.reason = (reason || '').trim();
    if (status !== undefined && ['Pending', 'Paid'].includes(status)) entry.status = status;

    entry.durationHours   = hours;
    entry.durationMinutes = minutes;
    entry.ratePerHour     = rate;
    entry.totalAmount     = overtimeAmount(hours, minutes, rate);

    await entry.save();
    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/overtime/:id/settle  (admin/HR marks an entry as Paid) — Req 8.7
// ─────────────────────────────────────────────────────────────────────────────
const settleOvertime = async (req, res) => {
  try {
    const entry = await Overtime.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Overtime entry not found' });

    entry.status = 'Paid';
    await entry.save();

    res.json({ success: true, data: entry });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/overtime/:id  (admin/HR deletes an entry)
// ─────────────────────────────────────────────────────────────────────────────
const deleteOvertime = async (req, res) => {
  try {
    const entry = await Overtime.findById(req.params.id);
    if (!entry) return res.status(404).json({ success: false, message: 'Overtime entry not found' });

    await entry.deleteOne();
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getOvertime,
  createOvertime,
  updateOvertime,
  settleOvertime,
  deleteOvertime,
};
