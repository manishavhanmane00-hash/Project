const Employee    = require('../models/Employee');
const Attendance   = require('../models/Attendance');
const Leave        = require('../models/Leave');
const Department   = require('../models/Department');
const User         = require('../models/User');

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/dashboard  — aggregated metrics for the admin dashboard
// ─────────────────────────────────────────────────────────────────────────────
const dashboardMetrics = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [totalEmployees, activeEmployees, presentToday, todayRecords, pendingLeave, totalUsers, departments] = await Promise.all([
      Employee.countDocuments(),
      Employee.countDocuments({ status: 'active' }),
      Attendance.countDocuments({ date: today, status: { $in: ['present', 'late'] } }),
      Attendance.find({ date: today }).lean(),
      Leave.countDocuments({ status: 'pending' }),
      User.countDocuments({ isActive: true }),
      Department.find().sort({ name: 1 }).lean(),
    ]);

    const presentCount = todayRecords.filter(r => r.status === 'present' || r.status === 'late').length;
    const absentCount   = totalEmployees - presentCount;

    // Department-wise employee distribution
    const deptCounts = await Employee.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    const deptMap = deptCounts.reduce((m, d) => { m[d._id] = d.count; return m; }, {});
    const departmentStats = departments.map(d => ({
      name: d.name,
      employeeCount: deptMap[d.name] || 0,
      status: d.status,
    }));

    // Attendance trend (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const weekRecords = await Attendance.find({ date: { $gte: sevenDaysAgo, $lte: today } }).lean();
    const attendanceTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const dayRecords = weekRecords.filter(r => r.date === d);
      attendanceTrend.push({
        date: d,
        present: dayRecords.filter(r => r.status === 'present').length,
        late: dayRecords.filter(r => r.status === 'late').length,
        absent: dayRecords.filter(r => r.status === 'absent').length,
        onLeave: dayRecords.filter(r => r.status === 'leave').length,
      });
    }

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        presentToday: presentCount,
        absentToday: absentCount,
        pendingLeave,
        activeUsers: totalUsers,
        departmentStats,
        attendanceTrend,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/attendance?from=&to=&department=&format=csv
// ─────────────────────────────────────────────────────────────────────────────
const attendanceReport = async (req, res) => {
  try {
    const { from, to, department, employeeId } = req.query;

    const filter = {};
    if (from && to) filter.date = { $gte: from, $lte: to };
    else if (from) filter.date = { $gte: from };
    else if (to) filter.date = { $lte: to };
    if (department) filter.department = department;
    if (employeeId) filter.employeeId = employeeId;

    // Employees only see their own records
    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    }

    const records = await Attendance.find(filter).sort({ date: -1 }).lean();

    if (req.query.format === 'csv') {
      const header = 'Date,Employee,Email,Department,CheckIn,CheckOut,Hours,Status,Late\n';
      const rows = records.map(r => [
        r.date,
        `"${r.name || ''}"`,
        r.email || '',
        `"${r.department || ''}"`,
        r.checkIn || '',
        r.checkOut || '',
        r.hours || 0,
        r.status || '',
        r.late ? 'Yes' : 'No',
      ].join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="attendance_report.csv"');
      return res.send(header + rows);
    }

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/leave?from=&to=&status=&format=csv
// ─────────────────────────────────────────────────────────────────────────────
const leaveReport = async (req, res) => {
  try {
    const { from, to, status } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    }
    if (status) filter.status = status;
    if (from || to) {
      filter.startDate = {};
      if (from) filter.startDate.$gte = from;
      if (to) filter.startDate.$lte = to;
    }

    const records = await Leave.find(filter).sort({ createdAt: -1 }).lean();

    if (req.query.format === 'csv') {
      const header = 'Employee,Email,Department,LeaveType,StartDate,EndDate,Days,Status,AppliedDate,ApprovedBy,RejectionReason\n';
      const rows = records.map(r => [
        `"${r.employeeName || ''}"`,
        r.email || '',
        `"${r.department || ''}"`,
        r.leaveType || '',
        r.startDate || '',
        r.endDate || '',
        r.days || 0,
        r.status || '',
        r.appliedDate || '',
        r.approvedBy || '',
        `"${(r.rejectionReason || '').replace(/"/g, '""')}"`,
      ].join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="leave_report.csv"');
      return res.send(header + rows);
    }

    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/employees?department=&status=&format=csv
// ─────────────────────────────────────────────────────────────────────────────
const employeeReport = async (req, res) => {
  try {
    const { department, status } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (status) filter.status = status;

    const employees = await Employee.find(filter).sort({ createdAt: -1 }).lean();

    if (req.query.format === 'csv') {
      const header = 'Name,Email,Phone,Department,Designation,JoiningDate,Status,Salary\n';
      const rows = employees.map(e => [
        `"${e.name || ''}"`,
        e.email || '',
        e.phone || '',
        `"${e.department || ''}"`,
        `"${e.designation || ''}"`,
        e.joiningDate || '',
        e.status || '',
        e.salary || 0,
      ].join(',')).join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="employee_report.csv"');
      return res.send(header + rows);
    }

    res.json({ success: true, count: employees.length, data: employees });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/reports/departments  — department-wise summary
// ─────────────────────────────────────────────────────────────────────────────
const departmentReport = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 }).lean();
    const empAgg = await Employee.aggregate([
      { $group: { _id: { dept: '$department', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const summary = {};
    empAgg.forEach(g => {
      const dept = g._id.dept || 'Unassigned';
      if (!summary[dept]) summary[dept] = { name: dept, total: 0, active: 0, inactive: 0, onLeave: 0 };
      summary[dept].total += g.count;
      if (g._id.status === 'active') summary[dept].active += g.count;
      else if (g._id.status === 'inactive') summary[dept].inactive += g.count;
      else if (g._id.status === 'on-leave') summary[dept].onLeave += g.count;
    });

    // Merge in any departments with zero employees
    departments.forEach(d => {
      if (!summary[d.name]) summary[d.name] = { name: d.name, total: 0, active: 0, inactive: 0, onLeave: 0 };
    });

    res.json({ success: true, data: Object.values(summary) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { dashboardMetrics, attendanceReport, leaveReport, employeeReport, departmentReport };
