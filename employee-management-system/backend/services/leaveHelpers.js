/**
 * leaveHelpers.js
 *
 * Pure, side-effect-free helpers for the Leave module. These functions contain
 * no database or I/O access so they can be unit- and property-tested in
 * isolation. The existing `getLeaveBalance`, `applyLeave`, `updateLeaveStatus`,
 * and `cancelLeave` logic in `leaveController.js` is unchanged; these helpers
 * are intended for additive use only.
 *
 * Conventions mirror `controllers/leaveController.js`:
 *  - Leave types and entitlements match the existing `LEAVE_ENTITLEMENT` map.
 *  - The stored `Leave` enum is never broken: the screenshot "Earned" label is
 *    mapped to the existing enum value "Annual Leave".
 */

// Default annual leave entitlements (days) per stored leave type.
// Mirrors LEAVE_ENTITLEMENT in leaveController.js. A value of 0 means the type
// is untracked (no balance enforced, e.g. Unpaid Leave).
const LEAVE_ENTITLEMENT = {
  'Annual Leave':       18,
  'Sick Leave':         10,
  'Casual Leave':        6,
  'Maternity Leave':    90,
  'Paternity Leave':    10,
  'Compensatory Leave':  5,
  'Unpaid Leave':        0, // unlimited, no balance tracking
};

// Mapping from the screenshot leave-type labels to the stored `Leave` enum
// values. Every label that is already a valid enum value maps to itself; only
// the "Earned" alias is remapped to "Annual Leave" (Req 2.3, 18.1).
const LEAVE_TYPE_LABEL_MAP = {
  Earned: 'Annual Leave',
};

/**
 * Map a leave-type label offered in the apply-leave form to the stored `Leave`
 * enum value. "Earned" maps to "Annual Leave"; every other label maps to
 * itself unchanged.
 *
 * @param {string} label - The leave-type label from the form.
 * @returns {string} The stored `leaveType` enum value.
 *
 * Validates: Requirements 2.3, 18.1
 */
const mapLeaveType = (label) =>
  Object.prototype.hasOwnProperty.call(LEAVE_TYPE_LABEL_MAP, label)
    ? LEAVE_TYPE_LABEL_MAP[label]
    : label;

/**
 * Validate the submitted date range. Accepts if and only if `endDate` is not
 * earlier than `startDate`. Dates are compared as calendar instants, matching
 * the existing `new Date(endDate) < new Date(startDate)` check in applyLeave.
 *
 * @param {string|Date} startDate
 * @param {string|Date} endDate
 * @returns {boolean} true when the range is valid (end >= start).
 *
 * Validates: Requirements 2.4
 */
const isValidDateRange = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return false;
  return end.getTime() >= start.getTime();
};

/**
 * Validate the submitted days value. Accepts if and only if `days` is a finite
 * number of at least 0.5, mirroring the existing applyLeave minimum.
 *
 * @param {number} days
 * @returns {boolean} true when days >= 0.5.
 *
 * Validates: Requirements 2.5
 */
const isValidDays = (days) => {
  const numDays = Number(days);
  return Number.isFinite(numDays) && numDays >= 0.5;
};

/**
 * Determine whether two inclusive date ranges intersect. Ranges overlap when
 * `aStart <= bEnd` and `aEnd >= bStart`, matching the overlap query used in
 * applyLeave (`startDate <= endDate` AND `endDate >= startDate`).
 *
 * @param {string|Date} aStart
 * @param {string|Date} aEnd
 * @param {string|Date} bStart
 * @param {string|Date} bEnd
 * @returns {boolean} true when the ranges intersect.
 */
const rangesOverlap = (aStart, aEnd, bStart, bEnd) => {
  const as = new Date(aStart).getTime();
  const ae = new Date(aEnd).getTime();
  const bs = new Date(bStart).getTime();
  const be = new Date(bEnd).getTime();
  if ([as, ae, bs, be].some(Number.isNaN)) return false;
  return as <= be && ae >= bs;
};

// Statuses that block a new overlapping leave request.
const BLOCKING_LEAVE_STATUSES = ['pending', 'approved'];

/**
 * Detect whether a requested date range overlaps any existing leave record that
 * blocks a new request (status pending or approved). Returns the first
 * overlapping record, or null when there is no conflict. This is a pure
 * predicate over an already-fetched list of records; the controller remains
 * responsible for the actual database query.
 *
 * @param {Array<{startDate: string|Date, endDate: string|Date, status: string}>} existingRecords
 * @param {string|Date} startDate - Requested range start.
 * @param {string|Date} endDate - Requested range end.
 * @returns {object|null} The first overlapping blocking record, or null.
 *
 * Validates: Requirements 2.6
 */
const findOverlappingLeave = (existingRecords, startDate, endDate) => {
  if (!Array.isArray(existingRecords)) return null;
  return (
    existingRecords.find(
      (record) =>
        record &&
        BLOCKING_LEAVE_STATUSES.includes(record.status) &&
        rangesOverlap(startDate, endDate, record.startDate, record.endDate)
    ) || null
  );
};

/**
 * Whether a leave type has a tracked balance. A type is balance-tracked when it
 * has a positive entitlement in `LEAVE_ENTITLEMENT`. Untracked types (e.g.
 * "Unpaid Leave", or any type absent from the map) return false.
 *
 * @param {string} leaveType - The stored leave-type enum value.
 * @returns {boolean} true when the type is balance-tracked.
 *
 * Validates: Requirements 2.7, 2.8
 */
const isBalanceTracked = (leaveType) => (LEAVE_ENTITLEMENT[leaveType] || 0) > 0;

/**
 * Determine whether a requested number of days exceeds the remaining balance
 * for a balance-tracked leave type. Untracked types (Unpaid Leave) never
 * exceed their balance, so this always returns false for them (Req 2.8).
 *
 * @param {string} leaveType - The stored leave-type enum value.
 * @param {number} requestedDays - The requested number of days.
 * @param {number} remainingBalance - The remaining balance for the type.
 * @returns {boolean} true when the request should be rejected for balance.
 *
 * Validates: Requirements 2.7, 2.8
 */
const exceedsBalance = (leaveType, requestedDays, remainingBalance) => {
  if (!isBalanceTracked(leaveType)) return false;
  const numDays = Number(requestedDays);
  const remaining = Number(remainingBalance);
  if (!Number.isFinite(numDays) || !Number.isFinite(remaining)) return false;
  return numDays > remaining;
};

module.exports = {
  LEAVE_ENTITLEMENT,
  LEAVE_TYPE_LABEL_MAP,
  mapLeaveType,
  isValidDateRange,
  isValidDays,
  rangesOverlap,
  findOverlappingLeave,
  isBalanceTracked,
  exceedsBalance,
};
