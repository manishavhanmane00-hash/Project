const Leave = require('../models/Leave');
const Notification = require('../models/Notification');
const User = require('../models/User');

// GET /api/leave  (admin: all; employee: own)
const getLeave = async (req, res) => {
  try {
    const { status, employeeId } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
    }
    if (status) filter.status = status;

    const records = await Leave.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/leave  (employee applies for leave)
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, days, reason } = req.body;
    if (!leaveType || !startDate || !endDate || !days)
      return res.status(400).json({ success: false, message: 'leaveType, startDate, endDate and days are required' });

    const leave = await Leave.create({
      employeeId:   req.user.id,
      userId:       req.user.id,
      email:        req.user.email,
      employeeName: req.user.name,
      department:   req.user.department || '',
      leaveType, startDate, endDate,
      days: Number(days),
      reason: reason || '',
      status: 'pending',
      appliedDate: new Date().toISOString().split('T')[0],
    });

    // Notify all admins
    const admins = await User.find({ role: { $in: ['Admin', 'HR', 'Manager'] } }).select('_id');
    await Notification.insertMany(admins.map(a => ({
      userId: a._id,
      employeeId: req.user.id,
      title: 'New Leave Request',
      message: `${req.user.name} applied for ${leaveType} (${days} day${days > 1 ? 's' : ''})`,
      type: 'leave',
    })));

    res.status(201).json({ success: true, data: leave });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/leave/:id/status  (admin approves/rejects)
const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;
    if (!['approved', 'rejected'].includes(status))
      return res.status(400).json({ success: false, message: 'Status must be approved or rejected' });

    const leave = await Leave.findByIdAndUpdate(
      req.params.id,
      { status, rejectionReason: rejectionReason || '', approvedBy: req.user.name, approvedAt: new Date() },
      { new: true }
    );
    if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found' });

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

module.exports = { getLeave, applyLeave, updateLeaveStatus };
