const Leave         = require('../models/Leave');
const Notification  = require('../models/Notification');
const User          = require('../models/User');
const Attendance    = require('../models/Attendance');
const mongoose      = require('mongoose');

// Default annual leave entitlements (days) per leave type
const LEAVE_ENTITLEMENT = {
  'Annual Leave':       18,
  'Sick Leave':         10,
  'Casual Leave':       6,
  'Maternity Leave':    90,
  'Paternity Leave':    10,
  'Compensatory Leave':  5,
  'Unpaid Leave':       0, // unlimited, no balance
};

/**
 * Compute the remaining balance for a given user + leave type
 * by subtracting approved days from the entitlement.
 */
const getLeaveBalance = async (userId, leaveType) => {
  const entitlement = LEAVE_ENTITLEMENT[leaveType];
  if (entitlement === undefined || entitlement === 0) return null; // unlimited/no tracking

  const used = await Leave.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId), leaveType, status: 'approved' } },
    { $group: { _id: null, total: { $sum: '$days' } } },
  ]);
  const usedDays = used.length ? used[0].total : 0;
  return { entitlement, used: usedDays, remaining: entitlement - usedDays };
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leave  (admin: all; employee: own)
// ─────────────────────────────────────────────────────────────────────────────
const getLeave = async (req, res) => {
  try {
    const { status, employeeId, leaveType } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
    }
    if (status) filter.status = status;
    if (leaveType) filter.leaveType = leaveType;

    const records = await Leave.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/leave/balance  — current leave balances for the authenticated user
// ─────────────────────────────────────────────────────────────────────────────
const getBalances = async (req, res) => {
  try {
    const balances = [];
    for (const [type, entitlement] of Object.entries(LEAVE_ENTITLEMENT)) {
      const balance = await getLeaveBalance(req.user.id, type);
      balances.push({
        leaveType: type,
        entitlement,
        used: balance ? balance.used : 0,
        remaining: balance ? balance.remaining : 'Unlimited',
      });
    }
    res.json({ success: true, data: balances });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/leave  (employee applies for leave)
//  - validates date range
//  - checks for overlapping pending/approved leave
//  - checks available balance for balance-tracked types
// ─────────────────────────────────────────────────────────────────────────────
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, days, reason } = req.body;

    if (!leaveType || !startDate || !endDate || !days) {
      return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate and days are required' });
    }

    // Validate date range
    if (new Date(endDate) < new Date(startDate)) {
      return res.status(400).json({ success: false, message: 'End date cannot be before start date' });
    }

    const numDays = Number(days);
    if (!numDays || numDays < 0.5) {
      return res.status(400).json({ success: false, message: 'Days must be at least 0.5' });
    }

    // Check for overlapping pending or approved leave
    const overlapping = await Leave.findOne({
      $or: [{ userId: req.user.id }, { email: req.user.email }],
      status: { $in: ['pending', 'approved'] },
      $and: [
        { startDate: { $lte: endDate } },
        { endDate: { $gte: startDate } },
      ],
    });
    if (overlapping) {
      return res.status(400).json({
        success: false,
        message: `You already have a ${overlapping.status} leave request (${overlapping.startDate} to ${overlapping.endDate}) that overlaps these dates.`,
      });
    }

    // Check available balance (for tracked leave types)
    if (LEAVE_ENTITLEMENT[leaveType] > 0) {
      const balance = await getLeaveBalance(req.user.id, leaveType);
      if (balance && balance.remaining < numDays) {
        return res.status(400).json({
          success: false,
          message: `Insufficient ${leaveType} balance. Available: ${balance.remaining} day(s), requested: ${numDays}.`,
        });
      }
    }

    const leave = await Leave.create({
      employeeId:   req.user.id,
      userId:       req.user.id,
      email:        req.user.email,
      employeeName: req.user.name,
      department:   req.user.department || '',
      leaveType, startDate, endDate,
      days: numDays,
      reason: (reason || '').trim(),
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
    });

    // Notify all admins/HR
    const admins = await User.find({ role: { $in: ['Admin', 'HR'] }, isActive: true }).select('_id');
    if (admins.length) {
      await Notification.insertMany(admins.map(a => ({
        userId: a._id,
        employeeId: req.user.id,
        title: 'New Leave Request',
        message: `${req.user.name} applied for ${leaveType} (${numDays} day${numDays > 1 ? 's' : ''}) from ${startDate} to ${endDate}`,
        type: 'leave',
      })));
    }

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/leave/:id/status  (admin/HR approves/rejects)
//  - prevents duplicate approvals
//  - updates balance safely
//  - marks attendance records as 'leave' when approved
//  - notifies the employee
// ─────────────────────────────────────────────────────────────────────────────
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });
    }

    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    // Prevent duplicate approvals / acting on already-resolved requests
    if (leave.status === 'approved' || leave.status === 'rejected') {
      return res.status(400).json({ success: false, message: `This request has already been ${leave.status}` });
    }
    if (leave.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'This request was cancelled by the employee' });
    }

    // Prevent self-approval — an admin cannot approve their own request
    if (leave.userId && leave.userId.toString() === req.user.id) {
      return res.status(403).json({ success: false, message: 'You cannot approve your own leave request' });
    }

    // If approving, verify the balance is still sufficient
    if (status === 'approved' && LEAVE_ENTITLEMENT[leave.leaveType] > 0) {
      const balance = await getLeaveBalance(leave.userId, leave.leaveType);
      if (balance && balance.remaining < leave.days) {
        return res.status(400).json({
          success: false,
          message: `Cannot approve — insufficient ${leave.leaveType} balance. Available: ${balance.remaining} day(s), requested: ${leave.days}.`,
        });
      }
      leave.balanceBefore = balance.remaining;
    }

    leave.status = status;
    leave.rejectionReason = rejectionReason || '';
    leave.approvedBy = req.user.name;
    leave.approvedAt = new Date();
    await leave.save();

    // When approved, mark attendance records as 'leave' for each day in the range
    if (status === 'approved') {
      const start = new Date(leave.startDate);
      const end   = new Date(leave.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        await Attendance.findOneAndUpdate(
          { employeeId: leave.employeeId, date: dateStr },
          {
            $set: {
              userId: leave.userId,
              employeeId: leave.employeeId,
              name: leave.employeeName,
              email: leave.email,
              department: leave.department || '',
              date: dateStr,
              status: 'leave',
              checkIn: null,
              checkOut: null,
              hours: 0,
              overtime: 0,
              late: false,
            },
          },
          { upsert: true, new: true }
        );
      }
    }

    // Notify the employee
    if (leave.userId) {
      await Notification.create({
        userId: leave.userId,
        employeeId: leave.employeeId,
        title: `Leave ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        message: `Your ${leave.leaveType} request (${leave.startDate} – ${leave.endDate}) has been ${status}${rejectionReason ? ': ' + rejectionReason : ''}`,
        type: 'leave',
      });
    }

    res.json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/leave/:id/cancel  (employee cancels their own pending request)
// ─────────────────────────────────────────────────────────────────────────────
const cancelLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

    // Employees can only cancel their own requests
    const isOwner = (leave.userId && leave.userId.toString() === req.user.id) || leave.email === req.user.email;
    if (!isOwner && !['Admin', 'HR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'You can only cancel your own leave requests' });
    }

    // Only pending requests can be cancelled
    if (leave.status !== 'pending') {
      return res.status(400).json({ success: false, message: `Only pending requests can be cancelled. This request is ${leave.status}.` });
    }

    leave.status = 'cancelled';
    leave.cancelledAt = new Date();
    await leave.save();

    res.json({ success: true, data: leave, message: 'Leave request cancelled' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getLeave, getBalances, applyLeave, updateLeaveStatus, cancelLeave, getLeaveBalance, LEAVE_ENTITLEMENT };
