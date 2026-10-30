const Attendance = require('../models/Attendance');

// Helper: parse "HH:MM" 24-hour time string → total minutes
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

// Helper: calculate working hours and overtime from 24h "HH:MM" strings
const calcHours = (checkIn, checkOut, normalHours = 9) => {
  const inMin  = toMinutes(checkIn);
  const outMin = toMinutes(checkOut);
  if (inMin === null || outMin === null) return { hours: 0, overtime: 0 };
  const diff = (outMin - inMin) / 60;
  if (diff <= 0) return { hours: 0, overtime: 0 };
  const hours    = Math.round(diff * 10) / 10;
  const overtime = hours > normalHours ? Math.round((hours - normalHours) * 10) / 10 : 0;
  return { hours, overtime };
};

// GET /api/attendance  (admin: all records; employee: own records only)
const getAttendance = async (req, res) => {
  try {
    const { date, month, employeeId, department } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      // Employees can ONLY see their own records — hard-scoped by userId/email
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
      if (department) filter.department = department;
    }

    if (date)  filter.date = date;
    if (month) filter.date = { $regex: `^${month}` };

    const records = await Attendance.find(filter).sort({ date: -1 });
    res.json({ success: true, count: records.length, data: records });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance  (admin marks attendance for any employee)
const markAttendance = async (req, res) => {
  try {
    const { employeeId, name, email, department, date, checkIn, checkOut, status, late } = req.body;
    if (!employeeId || !date)
      return res.status(400).json({ success: false, message: 'employeeId and date are required' });

    // Validate checkout not before checkin
    if (checkIn && checkOut) {
      const inMin  = toMinutes(checkIn);
      const outMin = toMinutes(checkOut);
      if (inMin !== null && outMin !== null && outMin <= inMin)
        return res.status(400).json({ success: false, message: 'Check-out time must be after check-in time' });
    }

    const { hours, overtime } = calcHours(checkIn, checkOut);

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      { employeeId, name, email, department, date, checkIn: checkIn || null, checkOut: checkOut || null,
        hours, overtime, status: status || 'present', late: late || false },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/self  (employee manages their own attendance for any date)
const selfMarkAttendance = async (req, res) => {
  try {
    const { date, status, checkIn, checkOut } = req.body;
    if (!date)   return res.status(400).json({ success: false, message: 'date is required' });
    if (!status) return res.status(400).json({ success: false, message: 'status is required' });

    const allowed = ['present', 'absent', 'half-day', 'leave', 'late'];
    if (!allowed.includes(status))
      return res.status(400).json({ success: false, message: 'Invalid status' });

    // Validate checkout not before checkin
    if (checkIn && checkOut) {
      const inMin  = toMinutes(checkIn);
      const outMin = toMinutes(checkOut);
      if (inMin !== null && outMin !== null && outMin <= inMin)
        return res.status(400).json({ success: false, message: 'Check-out time must be after check-in time' });
    }

    const { hours, overtime } = calcHours(checkIn, checkOut);

    // Scope strictly to the authenticated user — cannot forge another employee's ID
    // Use employeeId + date to match the unique index and avoid duplicate key errors
    const record = await Attendance.findOneAndUpdate(
      { employeeId: req.user.id, date },
      {
        $set: {
          userId:     req.user.id,
          employeeId: req.user.id,
          name:       req.user.name,
          email:      req.user.email,
          department: req.user.department || '',
          date,
          checkIn:   checkIn  || null,
          checkOut:  checkOut || null,
          hours,
          overtime,
          status,
          late: status === 'late',
        }
      },
      { upsert: true, new: true, runValidators: true }
    );
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/attendance/check-in  (employee checks in)
const checkIn = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const existing = await Attendance.findOne({ $or: [{ userId: req.user.id }, { email: req.user.email }], date: today });
    if (existing?.checkIn) return res.status(400).json({ success: false, message: 'Already checked in today' });

    const record = await Attendance.findOneAndUpdate(
      { $or: [{ userId: req.user.id }, { email: req.user.email }], date: today },
      {
        employeeId: req.user.id,
        userId: req.user.id,
        email: req.user.email,
        name: req.user.name,
        department: req.user.department || '',
        date: today,
        checkIn: now,
        status: 'present',
      },
      { upsert: true, new: true }
    );
    res.json({ success: true, data: record, message: `Checked in at ${now}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /api/attendance/check-out  (employee checks out)
const checkOut = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const now = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

    const record = await Attendance.findOne({ $or: [{ userId: req.user.id }, { email: req.user.email }], date: today });
    if (!record?.checkIn) return res.status(400).json({ success: false, message: 'You have not checked in today' });
    if (record.checkOut) return res.status(400).json({ success: false, message: 'Already checked out today' });

    // Calculate hours
    let hours = 0;
    try {
      const parseTime = (t) => {
        const [time, mer] = t.split(' ');
        let [h, m] = time.split(':').map(Number);
        if (mer === 'PM' && h < 12) h += 12;
        if (mer === 'AM' && h === 12) h = 0;
        return h * 60 + m;
      };
      hours = Math.round(((parseTime(now) - parseTime(record.checkIn)) / 60) * 10) / 10;
    } catch { hours = 0; }

    record.checkOut = now;
    record.hours = hours > 0 ? hours : 0;
    await record.save();

    res.json({ success: true, data: record, message: `Checked out at ${now}. Hours worked: ${hours}h` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Admin: correct an attendance record — stores an audit trail of the change
// PUT /api/attendance/:id/correct  (admin/HR)
const correctAttendance = async (req, res) => {
  try {
    const record = await Attendance.findById(req.params.id);
    if (!record) return res.status(404).json({ success: false, message: 'Attendance record not found' });

    const { checkIn, checkOut, status, late, reason } = req.body;
    const before = {
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      status: record.status,
      late: record.late,
    };

    if (checkIn !== undefined) record.checkIn = checkIn || null;
    if (checkOut !== undefined) record.checkOut = checkOut || null;
    if (status !== undefined) record.status = status;
    if (late !== undefined) record.late = late;

    if (record.checkIn && record.checkOut) {
      const { hours, overtime } = calcHours(record.checkIn, record.checkOut);
      record.hours = hours;
      record.overtime = overtime;
    }

    // Audit trail
    record.correctedAt = new Date();
    record.correctedBy = req.user.name;
    record.correctionReason = (reason || '').trim();
    record.correctionBefore = before;

    await record.save();
    res.json({ success: true, data: record });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Employee: fetch their own attendance summary for a month
// GET /api/attendance/my-summary?month=YYYY-MM
const mySummary = async (req, res) => {
  try {
    const { month } = req.query;
    if (!month) return res.status(400).json({ success: false, message: 'month (YYYY-MM) is required' });

    const records = await Attendance.find({
      $or: [{ userId: req.user.id }, { email: req.user.email }],
      date: { $regex: `^${month}` },
    }).sort({ date: 1 });

    const summary = {
      total: records.length,
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      halfDay: records.filter(r => r.status === 'half-day').length,
      leave: records.filter(r => r.status === 'leave').length,
      totalHours: records.reduce((s, r) => s + (r.hours || 0), 0),
      totalOvertime: records.reduce((s, r) => s + (r.overtime || 0), 0),
    };

    res.json({ success: true, data: { records, summary } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getAttendance, markAttendance, selfMarkAttendance, checkIn, checkOut, correctAttendance, mySummary };
