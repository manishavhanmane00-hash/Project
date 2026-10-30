/**
 * Overtime → Payroll sync service (pure logic, no DB access).
 *
 * These functions are intentionally free of any Mongoose / I/O so that the
 * double-counting and summation logic can be unit- and property-tested in
 * isolation (see design "Synchronization Architecture"). Controllers are
 * responsible for persistence and for marking entries as `counted`.
 */

// Month names used by the existing payroll flow, indexed 1-12.
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/**
 * Pure overtime-amount formula helper (Req 8.4).
 * Overtime_Amount = (durationHours + durationMinutes / 60) * ratePerHour.
 *
 * @param {number} durationHours
 * @param {number} durationMinutes
 * @param {number} ratePerHour
 * @returns {number} the computed overtime amount (0 for non-finite/missing inputs)
 */
function overtimeAmount(durationHours, durationMinutes, ratePerHour) {
  const h = Number(durationHours) || 0;
  const m = Number(durationMinutes) || 0;
  const rate = Number(ratePerHour) || 0;
  return (h + m / 60) * rate;
}

/**
 * Pure overtime input-validation predicate (Req 8.5).
 * Accepted iff at least one of durationHours / durationMinutes is > 0 AND
 * ratePerHour is non-negative; otherwise rejected.
 *
 * @param {{durationHours?: number, durationMinutes?: number, ratePerHour?: number}} input
 * @returns {boolean} true when the submission is valid
 */
function isValidOvertimeInput(input) {
  if (!input || typeof input !== 'object') return false;
  const h = Number(input.durationHours) || 0;
  const m = Number(input.durationMinutes) || 0;
  const rate = Number(input.ratePerHour);
  const hasDuration = h > 0 || m > 0;
  const rateOk = Number.isFinite(rate) && rate >= 0;
  return hasDuration && rateOk;
}

/**
 * Normalize a month value (number, numeric string, or month name) to 1-12.
 * Returns null when it cannot be interpreted.
 */
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
 * Extract { year, month } (month 1-12) from a 'YYYY-MM-DD' date string.
 * Returns null when the date cannot be parsed.
 */
function parseEntryDate(date) {
  if (typeof date !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) return null;
  return { year, month };
}

/**
 * Determine whether an entry qualifies for a given payroll month/year.
 * Qualifying = status "Pending", not already counted, and the entry's date
 * falls within the same month and year.
 */
function qualifies(entry, targetMonth, targetYear) {
  if (!entry || typeof entry !== 'object') return false;
  if (entry.status !== 'Pending') return false;
  if (entry.counted === true) return false;

  const parsed = parseEntryDate(entry.date);
  if (!parsed) return false;

  return parsed.month === targetMonth && parsed.year === targetYear;
}

/**
 * Pure sum of Pending, not-yet-counted overtime amounts for (month, year)
 * (Req 9.1, 9.2, 9.4).
 *
 * The sum uses each entry's stored `totalAmount` when present, otherwise it
 * recomputes the amount from the duration/rate via `overtimeAmount`.
 *
 * @param {Array<object>} entries  overtime entries (plain objects)
 * @param {string|number} month    payroll month (name, numeric string, or 1-12)
 * @param {number} year            payroll year
 * @returns {{ amount: number, entryIds: Array }}
 *   amount: total overtime earnings (0 when no qualifying entry)
 *   entryIds: ids of the contributing entries (in input order)
 */
function overtimeEarningsFor(entries, month, year) {
  const result = { amount: 0, entryIds: [] };
  if (!Array.isArray(entries)) return result;

  const targetMonth = normalizeMonth(month);
  const targetYear = Number(year);
  if (targetMonth === null || !Number.isFinite(targetYear)) return result;

  for (const entry of entries) {
    if (!qualifies(entry, targetMonth, targetYear)) continue;

    const amt = entry.totalAmount !== undefined && entry.totalAmount !== null
      ? Number(entry.totalAmount) || 0
      : overtimeAmount(entry.durationHours, entry.durationMinutes, entry.ratePerHour);

    result.amount += amt;

    const id = entry._id !== undefined ? entry._id : entry.id;
    if (id !== undefined) result.entryIds.push(id);
  }

  return result;
}

module.exports = {
  overtimeAmount,
  isValidOvertimeInput,
  overtimeEarningsFor,
};
