const Holiday = require('../models/Holiday');
const Employee = require('../models/Employee');
const Attendance = require('../models/Attendance');
const { isValidHolidayForm, expandHolidayRule, holidayAttendanceUpserts } = require('../services/holidaySync');

// Human-readable validation message when a submission fails the holidaySync predicate.
const INVALID_HOLIDAY_MESSAGE =
  'Invalid holiday: holidayName and type are required, and a valid rule for the type must be provided ' +
  '(a date for Festival/Custom, a day-of-week for Weekly, or a day-of-month for Monthly).';

/**
 * Normalize an incoming request body into the Holiday_Record shape the model and
 * the holidaySync validation predicate expect. Recurrence day values are coerced
 * to integers (or null) so the pure predicate can validate them.
 */
const buildHolidayPayload = (body = {}) => {
  const {
    holidayName,
    type,
    date,
    recurrence,
    status,
    description,
    paidStatus,
    applicableAll,
    applicableEmployees,
    employeeId,
    userId,
  } = body;

  const toIntOrNull = (v) =>
    v === undefined || v === null || v === '' || Number.isNaN(Number(v)) ? null : Math.trunc(Number(v));

  const payload = {
    holidayName: typeof holidayName === 'string' ? holidayName.trim() : holidayName,
    type,
    date: date || null,
    recurrence: {
      dayOfWeek: toIntOrNull(recurrence ? recurrence.dayOfWeek : null),
      dayOfMonth: toIntOrNull(recurrence ? recurrence.dayOfMonth : null),
    },
  };

  if (status !== undefined) payload.status = status;
  if (description !== undefined) payload.description = (description || '').trim();
  if (paidStatus !== undefined) payload.paidStatus = paidStatus;

  // Applicable_Employees: when not applicable-to-all, store the selected subset by employeeId.
  const isAll = applicableAll === undefined ? true : Boolean(applicableAll);
  payload.applicableAll = isAll;
  if (isAll) {
    payload.applicableEmployees = [];
  } else {
    payload.applicableEmployees = Array.isArray(applicableEmployees)
      ? applicableEmployees.filter((id) => id != null && id !== '').map((id) => String(id))
      : [];
  }

  if (employeeId !== undefined) payload.employeeId = employeeId;
  if (userId !== undefined) payload.userId = userId;

  return payload;
};

/**
 * Resolve the applicable employeeIds for a holiday.
 *  - applicableAll === true  -> every employee in the directory (by employeeId)
 *  - otherwise               -> the holiday's stored applicableEmployees subset
 * Only non-empty employeeId values are returned, de-duplicated.
 */
const resolveApplicableEmployees = async (holiday) => {
  let ids;
  if (holiday.applicableAll) {
    const employees = await Employee.find({}).select('employeeId');
    ids = employees.map((e) => e.employeeId);
  } else {
    ids = Array.isArray(holiday.applicableEmployees) ? holiday.applicableEmployees : [];
  }
  return Array.from(new Set(ids.filter((id) => id != null && id !== '').map((id) => String(id))));
};

/**
 * Holiday → Attendance synchronization for an active holiday.
 *
 * Expands the Holiday_Rule across the current calendar year, then for each matching
 * date upserts an Attendance_Record (status 'leave') per applicable employee keyed by
 * (employeeId, date) — reusing the same upsert pattern as leave approval so a holiday
 * + approved leave on the same day never produces a second record.
 *
 * The Computed_Attendance_Overtime (`Attendance.overtime`) field is NEVER written.
 *
 * Non-active holidays are a no-op. Failures are logged but not rethrown so that a
 * successful holiday create/update is not rolled back by a sync problem.
 *
 * @param {object} holiday - a persisted Holiday_Record
 */
const syncHolidayAttendance = async (holiday) => {
  try {
    if (!holiday || holiday.status !== 'active') return;

    // Expand recurrence over the current year window (fixed Festival/Custom dates
    // only contribute when they fall inside this range).
    const year = new Date().getUTCFullYear();
    const rangeStart = `${year}-01-01`;
    const rangeEnd = `${year}-12-31`;
    const dates = expandHolidayRule(holiday, rangeStart, rangeEnd);
    if (!dates.length) return;

    const applicableEmployees = await resolveApplicableEmployees(holiday);
    if (!applicableEmployees.length) return;

    // Preload employee directory details for the Attendance denormalized fields.
    const employees = await Employee.find({ employeeId: { $in: applicableEmployees } })
      .select('employeeId name email department userId');
    const byId = new Map(employees.map((e) => [String(e.employeeId), e]));

    for (const date of dates) {
      const upserts = holidayAttendanceUpserts(holiday, date, applicableEmployees);
      for (const { employeeId, status } of upserts) {
        const emp = byId.get(String(employeeId));
        const setFields = {
          employeeId,
          date,
          status, // 'leave'
        };
        if (emp) {
          setFields.userId = emp.userId || undefined;
          setFields.name = emp.name;
          setFields.email = emp.email;
          setFields.department = emp.department || '';
        }
        // Upsert keyed by (employeeId, date). We intentionally DO NOT write the
        // `overtime` field (Computed_Attendance_Overtime) — it is left untouched
        // on existing records and defaults on new ones.
        await Attendance.findOneAndUpdate(
          { employeeId, date },
          { $set: setFields },
          { upsert: true, new: true }
        );
      }
    }
  } catch (err) {
    // Sync is best-effort and must not fail the holiday mutation it accompanies.
    // eslint-disable-next-line no-console
    console.error('Holiday attendance sync failed:', err.message);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/holidays  — list all holidays
// ─────────────────────────────────────────────────────────────────────────────
const getHolidays = async (req, res) => {
  try {
    const { status, type } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const holidays = await Holiday.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: holidays.length, data: holidays });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/holidays/:id
// ─────────────────────────────────────────────────────────────────────────────
const getHolidayById = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });
    res.json({ success: true, data: holiday });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/holidays  (admin/HR) — create a holiday
//  - validates via the pure holidaySync predicate
//  - stores the Applicable_Employees subset by employeeId
// ─────────────────────────────────────────────────────────────────────────────
const createHoliday = async (req, res) => {
  try {
    const payload = buildHolidayPayload(req.body);

    if (!isValidHolidayForm(payload)) {
      return res.status(400).json({ success: false, message: INVALID_HOLIDAY_MESSAGE });
    }

    const holiday = await Holiday.create(payload);

    // Synchronize attendance when the new holiday is active.
    if (holiday.status === 'active') {
      await syncHolidayAttendance(holiday);
    }

    res.status(201).json({ success: true, data: holiday });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/holidays/:id  (admin/HR) — update a holiday
// ─────────────────────────────────────────────────────────────────────────────
const updateHoliday = async (req, res) => {
  try {
    const existing = await Holiday.findById(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Holiday not found' });

    // Merge incoming fields over the existing record so partial edits still
    // produce a complete, valid Holiday_Rule for the predicate check.
    const merged = buildHolidayPayload({
      holidayName: req.body.holidayName !== undefined ? req.body.holidayName : existing.holidayName,
      type: req.body.type !== undefined ? req.body.type : existing.type,
      date: req.body.date !== undefined ? req.body.date : existing.date,
      recurrence: {
        dayOfWeek:
          req.body.recurrence && req.body.recurrence.dayOfWeek !== undefined
            ? req.body.recurrence.dayOfWeek
            : existing.recurrence
            ? existing.recurrence.dayOfWeek
            : null,
        dayOfMonth:
          req.body.recurrence && req.body.recurrence.dayOfMonth !== undefined
            ? req.body.recurrence.dayOfMonth
            : existing.recurrence
            ? existing.recurrence.dayOfMonth
            : null,
      },
      status: req.body.status !== undefined ? req.body.status : existing.status,
      description: req.body.description !== undefined ? req.body.description : existing.description,
      paidStatus: req.body.paidStatus !== undefined ? req.body.paidStatus : existing.paidStatus,
      applicableAll: req.body.applicableAll !== undefined ? req.body.applicableAll : existing.applicableAll,
      applicableEmployees:
        req.body.applicableEmployees !== undefined ? req.body.applicableEmployees : existing.applicableEmployees,
      employeeId: req.body.employeeId !== undefined ? req.body.employeeId : existing.employeeId,
      userId: req.body.userId !== undefined ? req.body.userId : existing.userId,
    });

    if (!isValidHolidayForm(merged)) {
      return res.status(400).json({ success: false, message: INVALID_HOLIDAY_MESSAGE });
    }

    const holiday = await Holiday.findByIdAndUpdate(req.params.id, merged, {
      new: true,
      runValidators: true,
    });

    // Synchronize attendance when the updated holiday is active.
    if (holiday.status === 'active') {
      await syncHolidayAttendance(holiday);
    }

    res.json({ success: true, data: holiday });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/holidays/:id  (admin/HR)
// ─────────────────────────────────────────────────────────────────────────────
const deleteHoliday = async (req, res) => {
  try {
    const holiday = await Holiday.findById(req.params.id);
    if (!holiday) return res.status(404).json({ success: false, message: 'Holiday not found' });

    await Holiday.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Holiday deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = { getHolidays, getHolidayById, createHoliday, updateHoliday, deleteHoliday };
