const Attendance = require('../models/Attendance');

// GET /api/attendance  (admin: all records; employee: own records)
const getAttendance = async (req, res) => {
  try {
    const { date, month, employeeId, department } = req.query;
    const filter = {};

    if (req.user.role === 'Employee') {
      // Employees can only see their own records
      filter.$or = [{ userId: req.user.id }, { email: req.user.email }];
    } else {
      if (employeeId) filter.employeeId = employeeId;
      if (department) filter.department = department;
    }

    if (date) filter.date = date;
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
    const { employeeId, name, email, department, date, checkIn, checkOut, hours, overtime, status, late } = req.body;
    if (!employeeId || !date) return res.status(400).json({ success: false, message: 'employeeId and date are required' });

    const record = await Attendance.findOneAndUpdate(
      { employeeId, date },
      { employeeId, name, email, department, date, checkIn, checkOut, hours: hours || 0, overtime: overtime || 0, status: status || 'present', late: late || false },
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

module.exports = { getAttendance, markAttendance, checkIn, checkOut };
