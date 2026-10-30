/**
 * Holiday synchronization service — pure logic only (no DB access).
 *
 * Responsibilities:
 *  - expandHolidayRule:        expand a Holiday_Rule into concrete 'YYYY-MM-DD' dates in a range
 *  - holidayAttendanceUpserts: compute attendance upsert descriptors for an active holiday on a date
 *  - isValidHolidayForm:       validate an Add/Edit Holiday submission
 *  - upcomingHolidays:         select + order holidays whose applicable date is on/after today
 *
 * All functions are deterministic and side-effect free. Dates are handled as
 * 'YYYY-MM-DD' strings using UTC arithmetic to avoid timezone/DST drift.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse a 'YYYY-MM-DD' string into a UTC Date at midnight.
 * Returns null when the string is malformed or not a real calendar date.
 * @param {string} str
 * @returns {Date|null}
 */
function parseISODate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  // Reject overflow dates (e.g. 2024-02-31 -> Mar 2).
  if (
    dt.getUTCFullYear() !== y ||
    dt.getUTCMonth() !== m - 1 ||
    dt.getUTCDate() !== d
  ) {
    return null;
  }
  return dt;
}

/**
 * Format a UTC Date into a 'YYYY-MM-DD' string.
 * @param {Date} dt
 * @returns {string}
 */
function formatISODate(dt) {
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add a whole number of days to a UTC Date, returning a new Date.
 * @param {Date} dt
 * @param {number} days
 * @returns {Date}
 */
function addDays(dt, days) {
  return new Date(dt.getTime() + days * 86400000);
}

/**
 * Determine whether a given 'YYYY-MM-DD' date matches a holiday's Holiday_Rule.
 * Pure helper used by both expansion and attendance synchronization.
 *
 * @param {object} holiday - Holiday_Record (type, date, recurrence)
 * @param {string} dateStr - 'YYYY-MM-DD'
 * @returns {boolean}
 */
function dateMatchesRule(holiday, dateStr) {
  if (!holiday || typeof holiday !== 'object') return false;
  const dt = parseISODate(dateStr);
  if (!dt) return false;

  switch (holiday.type) {
    case 'Festival':
    case 'Custom':
      return holiday.date === dateStr;
    case 'Weekly': {
      const dow = holiday.recurrence ? holiday.recurrence.dayOfWeek : null;
      if (!Number.isInteger(dow) || dow < 0 || dow > 6) return false;
      return dt.getUTCDay() === dow;
    }
    case 'Monthly': {
      const dom = holiday.recurrence ? holiday.recurrence.dayOfMonth : null;
      if (!Number.isInteger(dom) || dom < 1 || dom > 31) return false;
      return dt.getUTCDate() === dom;
    }
    default:
      return false;
  }
}

/**
 * Expand a Holiday_Rule into the concrete dates it produces within an inclusive range.
 *
 * - Festival/Custom: the single fixed `date`, if it falls within the range.
 * - Weekly: every date in range whose day-of-week equals recurrence.dayOfWeek.
 * - Monthly: every date in range whose day-of-month equals recurrence.dayOfMonth
 *   (months without that day simply produce no occurrence).
 *
 * Soundness + completeness: the returned set contains exactly the in-range dates
 * that match the rule — no extras, no omissions (Property 9). Results are sorted
 * ascending and de-duplicated.
 *
 * @param {object} holiday - Holiday_Record
 * @param {string} rangeStart - inclusive 'YYYY-MM-DD'
 * @param {string} rangeEnd - inclusive 'YYYY-MM-DD'
 * @returns {string[]} ascending 'YYYY-MM-DD' dates
 */
function expandHolidayRule(holiday, rangeStart, rangeEnd) {
  const start = parseISODate(rangeStart);
  const end = parseISODate(rangeEnd);
  if (!holiday || !start || !end || start.getTime() > end.getTime()) return [];

  const results = [];

  switch (holiday.type) {
    case 'Festival':
    case 'Custom': {
      const dt = parseISODate(holiday.date);
      if (dt && dt.getTime() >= start.getTime() && dt.getTime() <= end.getTime()) {
        results.push(holiday.date);
      }
      break;
    }
    case 'Weekly': {
      const dow = holiday.recurrence ? holiday.recurrence.dayOfWeek : null;
      if (Number.isInteger(dow) && dow >= 0 && dow <= 6) {
        for (let cur = start; cur.getTime() <= end.getTime(); cur = addDays(cur, 1)) {
          if (cur.getUTCDay() === dow) results.push(formatISODate(cur));
        }
      }
      break;
    }
    case 'Monthly': {
      const dom = holiday.recurrence ? holiday.recurrence.dayOfMonth : null;
      if (Number.isInteger(dom) && dom >= 1 && dom <= 31) {
        for (let cur = start; cur.getTime() <= end.getTime(); cur = addDays(cur, 1)) {
          if (cur.getUTCDate() === dom) results.push(formatISODate(cur));
        }
      }
      break;
    }
    default:
      break;
  }

  // De-duplicate and sort ascending.
  return Array.from(new Set(results)).sort();
}

/**
 * Compute the attendance upsert descriptors for an active holiday on a specific date.
 *
 * A descriptor is `{ employeeId, date, status: 'leave' }`. The function returns:
 *  - [] when the holiday is not active, the date does not match the rule, or there
 *    are no applicable employees;
 *  - otherwise one descriptor per applicable employee, with at most one descriptor
 *    per (employeeId, date) pair (duplicates in the input are collapsed) (Property 8, 11).
 *
 * The caller performs the actual upsert keyed by (employeeId, date), so coexisting
 * approved leave on the same day never yields a second attendance record.
 *
 * @param {object} holiday - Holiday_Record (status, type, date/recurrence, applicable*)
 * @param {string} date - 'YYYY-MM-DD'
 * @param {string[]} [applicableEmployees] - resolved applicable employeeIds for this holiday
 * @returns {Array<{employeeId: string, date: string, status: 'leave'}>}
 */
function holidayAttendanceUpserts(holiday, date, applicableEmployees) {
  if (!holiday || holiday.status !== 'active') return [];
  if (!dateMatchesRule(holiday, date)) return [];

  // Resolve the applicable employee set: explicit argument wins; otherwise fall
  // back to the holiday's own applicableEmployees subset. "applicableAll" holidays
  // must have their full employee set supplied by the caller via applicableEmployees.
  let employees = applicableEmployees;
  if (!Array.isArray(employees)) {
    employees = Array.isArray(holiday.applicableEmployees) ? holiday.applicableEmployees : [];
  }

  const seen = new Set();
  const descriptors = [];
  for (const employeeId of employees) {
    if (employeeId == null || employeeId === '') continue;
    if (seen.has(employeeId)) continue; // one descriptor per (employeeId, date)
    seen.add(employeeId);
    descriptors.push({ employeeId, date, status: 'leave' });
  }
  return descriptors;
}

/**
 * Validate an Add/Edit Holiday submission (Property 12).
 *
 * Accepted iff:
 *  - holidayName is present (non-empty after trim), AND
 *  - type is one of the Holiday_Type options, AND
 *  - a valid Holiday_Rule is present for that type:
 *      Festival/Custom -> a valid 'YYYY-MM-DD' date
 *      Weekly          -> recurrence.dayOfWeek in 0..6
 *      Monthly         -> recurrence.dayOfMonth in 1..31
 *
 * @param {object} holiday - candidate submission
 * @returns {boolean}
 */
function isValidHolidayForm(holiday) {
  if (!holiday || typeof holiday !== 'object') return false;

  const name = holiday.holidayName;
  if (typeof name !== 'string' || name.trim() === '') return false;

  const validTypes = ['Weekly', 'Monthly', 'Festival', 'Custom'];
  if (!validTypes.includes(holiday.type)) return false;

  switch (holiday.type) {
    case 'Festival':
    case 'Custom':
      return parseISODate(holiday.date) !== null;
    case 'Weekly': {
      const dow = holiday.recurrence ? holiday.recurrence.dayOfWeek : null;
      return Number.isInteger(dow) && dow >= 0 && dow <= 6;
    }
    case 'Monthly': {
      const dom = holiday.recurrence ? holiday.recurrence.dayOfMonth : null;
      return Number.isInteger(dom) && dom >= 1 && dom <= 31;
    }
    default:
      return false;
  }
}

/**
 * Select the upcoming-holidays list: holidays whose applicable date is on or after
 * `today`, ordered by ascending date (Property 10).
 *
 * Each holiday is expected to carry an `applicableDate` ('YYYY-MM-DD') — the next
 * occurrence date resolved by the caller (e.g. via expandHolidayRule). Holidays
 * without a valid applicable date, or whose date is strictly before today, are
 * excluded.
 *
 * @param {Array<object>} holidays - each with an `applicableDate` 'YYYY-MM-DD'
 * @param {string} today - 'YYYY-MM-DD' current date
 * @param {function} [getDate] - optional accessor returning a holiday's 'YYYY-MM-DD' date
 * @returns {Array<object>} filtered holidays sorted ascending by applicable date
 */
function upcomingHolidays(holidays, today, getDate) {
  if (!Array.isArray(holidays)) return [];
  const todayDt = parseISODate(today);
  if (!todayDt) return [];

  const accessor = typeof getDate === 'function' ? getDate : (h) => h && h.applicableDate;

  return holidays
    .map((h) => ({ holiday: h, dt: parseISODate(accessor(h)) }))
    .filter(({ dt }) => dt !== null && dt.getTime() >= todayDt.getTime())
    .sort((a, b) => a.dt.getTime() - b.dt.getTime())
    .map(({ holiday }) => holiday);
}

module.exports = {
  expandHolidayRule,
  holidayAttendanceUpserts,
  isValidHolidayForm,
  upcomingHolidays,
  // exported for reuse/testing of the pure date + rule primitives
  dateMatchesRule,
  parseISODate,
  formatISODate,
};
