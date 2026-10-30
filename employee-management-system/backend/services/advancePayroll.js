/**
 * Advance → Payroll sync service (pure logic, no DB access).
 *
 * These functions are intentionally free of any Mongoose / I/O so that the
 * deduction-summation and duplicate-deduction logic can be unit- and
 * property-tested in isolation (see design "Synchronization Architecture").
 * Controllers are responsible for persistence and for marking records as
 * `deducted`.
 */

// Advance_Status indicating the advance is recovered through payroll (Req 11.1).
const SALARY_ADJUSTMENT = 'Salary Adjustment';

// Number of days in a given month (1-12) accounting for leap years.
function daysInMonth(month, year) {
  // Day 0 of the next month is the last day of the target month.
  return new Date(year, month, 0).getDate();
}

/**
 * Normalize a month value (number, numeric string, or month name) to 1-12.
 * Returns null when it cannot be interpreted.
 */
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function normalizeMonth(month) {
  if (month === null || month === undefined) return null;
  if (typeof month === 'number' && Number.isFinite(month)) {
    return month >= 1 && month <= 12 ? month : null;
  }
  const str = String(month).trim();
  if (str === '') return null;
  // Numeric string e.g. "1", "01", "12"
  if (/^\d+$/.test(str)) {
    const n = Number(str);
    return n >= 1 && n <= 12 ? n : null;
  }
  // Month name (case-insensitive, full or 3-letter prefix)
  const lower = str.toLowerCase();
  const idx = MONTH_NAMES.findIndex(
    (name) => name.toLowerCase() === lower || name.toLowerCase().startsWith(lower.slice(0, 3))
  );
  return idx === -1 ? null : idx + 1;
}

/**
 * Parse a 'YYYY-MM-DD' date string into a comparable { year, month, day }.
 * Returns null when the date cannot be parsed.
 */
function parseRecordDate(date) {
  if (typeof date !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12) return null;
  if (day < 1 || day > 31) return null;
  return { year, month, day };
}

/**
 * Compare a parsed record date against the last day of a payroll period.
 * Returns true when the record date is on or before the period end.
 */
function isOnOrBeforePeriodEnd(parsed, targetMonth, targetYear) {
  const endDay = daysInMonth(targetMonth, targetYear);
  // Compare lexicographically by (year, month, day).
  if (parsed.year !== targetYear) return parsed.year < targetYear;
  if (parsed.month !== targetMonth) return parsed.month < targetMonth;
  return parsed.day <= endDay;
}

/**
 * Pure advance amount-validation predicate (Req 10.5).
 * Accepted iff the amount is a finite number greater than zero.
 *
 * @param {number} amount
 * @returns {boolean} true when the advance amount is valid
 */
function isValidAdvanceAmount(amount) {
  const value = Number(amount);
  return Number.isFinite(value) && value > 0;
}

/**
 * Determine whether a record qualifies for a given payroll month/year.
 * Qualifying = status "Salary Adjustment", not already deducted, and the
 * record's date falls on or before the last day of the target month/year.
 * Records with status Settled/Returned or Pending never qualify (Req 11.4).
 */
function qualifies(record, targetMonth, targetYear) {
  if (!record || typeof record !== 'object') return false;
  if (record.status !== SALARY_ADJUSTMENT) return false;
  if (record.deducted === true) return false;

  const parsed = parseRecordDate(record.date);
  if (!parsed) return false;

  return isOnOrBeforePeriodEnd(parsed, targetMonth, targetYear);
}

/**
 * Pure sum of Salary Adjustment, not-yet-deducted advance amounts dated on or
 * before the last day of (month, year) (Req 11.1, 11.4).
 *
 * Records whose status is Settled/Returned or Pending contribute 0 because
 * they never qualify.
 *
 * @param {Array<object>} records  advance records (plain objects)
 * @param {string|number} month    payroll month (name, numeric string, or 1-12)
 * @param {number} year            payroll year
 * @returns {{ amount: number, recordIds: Array }}
 *   amount: total advance deductions (0 when no qualifying record)
 *   recordIds: ids of the contributing records (in input order)
 */
function advanceDeductionsFor(records, month, year) {
  const result = { amount: 0, recordIds: [] };
  if (!Array.isArray(records)) return result;

  const targetMonth = normalizeMonth(month);
  const targetYear = Number(year);
  if (targetMonth === null || !Number.isFinite(targetYear)) return result;

  for (const record of records) {
    if (!qualifies(record, targetMonth, targetYear)) continue;

    const amt = Number(record.amount) || 0;
    result.amount += amt;

    const id = record._id !== undefined ? record._id : record.id;
    if (id !== undefined) result.recordIds.push(id);
  }

  return result;
}

module.exports = {
  isValidAdvanceAmount,
  advanceDeductionsFor,
};
