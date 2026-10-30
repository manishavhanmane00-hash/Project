// =============================================
// Shared record list utility selectors
// Pure, side-effect-free selectors used by the Leave, Holiday, Overtime,
// and Advance list pages for searching/filtering and CSV export.
//
// Design references:
//   Property 2  — List filtering returns the exact matching subset
//                 (search by employee name or record id, status filter, type filter)
//   Property 25 — Export reflects the currently filtered records
//
// All functions are pure: no DOM access, no I/O, no mutation of inputs. The
// browser download side effect (Blob/anchor click) is intentionally kept out of
// these selectors and belongs in the calling component.
// =============================================

/**
 * Resolve the record identifier used for id-based search matching.
 * Records across modules carry a Mongo `_id`; some may also expose `id`.
 * @param {object} record
 * @returns {string} the record id as a string ('' when absent)
 */
const getRecordId = (record) => {
  if (!record || typeof record !== 'object') return '';
  const raw = record._id !== undefined && record._id !== null ? record._id : record.id;
  return raw === undefined || raw === null ? '' : String(raw);
};

/**
 * Case-insensitive "contains" test that tolerates null/undefined haystacks.
 * @param {*} haystack
 * @param {string} needleLower - already lower-cased search term
 * @returns {boolean}
 */
const containsInsensitive = (haystack, needleLower) => {
  if (haystack === undefined || haystack === null) return false;
  return String(haystack).toLowerCase().includes(needleLower);
};

/**
 * Pure filter selector for a module record list (Property 2).
 *
 * A record is included iff it satisfies ALL active filters:
 *  - search:  the (trimmed, case-insensitive) term appears in the record's
 *             employee name OR its record id. An empty/whitespace term is
 *             inactive and matches every record.
 *  - status:  the record's status equals the selected status. A falsy
 *             (''/null/undefined) or 'all' selection is inactive.
 *  - type:    the record's type equals the selected type. A falsy or 'all'
 *             selection is inactive.
 *
 * No matching record is omitted and no non-matching record is included. Input
 * order is preserved and the input array is never mutated.
 *
 * @param {Array<object>} records - the full record set for the module
 * @param {object} [filters]
 * @param {string} [filters.search]   - free-text search term
 * @param {string} [filters.status]   - selected status value ('' / 'all' = any)
 * @param {string} [filters.type]     - selected type value ('' / 'all' = any)
 * @param {object} [options]
 * @param {string} [options.nameField='employeeName'] - field holding the employee name
 * @param {string} [options.statusField='status']     - field holding the status
 * @param {string} [options.typeField='type']         - field holding the type
 * @returns {Array<object>} the exact subset of records matching all active filters
 */
export const filterRecords = (records, filters = {}, options = {}) => {
  if (!Array.isArray(records)) return [];

  const {
    nameField = 'employeeName',
    statusField = 'status',
    typeField = 'type',
  } = options;

  const searchTerm = typeof filters.search === 'string' ? filters.search.trim().toLowerCase() : '';
  const statusFilter = filters.status;
  const typeFilter = filters.type;

  const statusActive = statusFilter !== undefined && statusFilter !== null
    && statusFilter !== '' && statusFilter !== 'all';
  const typeActive = typeFilter !== undefined && typeFilter !== null
    && typeFilter !== '' && typeFilter !== 'all';

  return records.filter((record) => {
    if (!record || typeof record !== 'object') return false;

    // Search: match on employee name OR record id.
    if (searchTerm !== '') {
      const nameMatch = containsInsensitive(record[nameField], searchTerm);
      const idMatch = containsInsensitive(getRecordId(record), searchTerm);
      if (!nameMatch && !idMatch) return false;
    }

    // Status filter: exact equality.
    if (statusActive && record[statusField] !== statusFilter) return false;

    // Type filter: exact equality.
    if (typeActive && record[typeField] !== typeFilter) return false;

    return true;
  });
};

/**
 * Escape a single CSV field per RFC 4180: wrap in double quotes when the value
 * contains a comma, double quote, or newline, doubling any embedded quotes.
 * @param {*} value
 * @returns {string}
 */
const escapeCsvField = (value) => {
  const str = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Pure CSV export selector (Property 25).
 *
 * Produces a CSV string from the records it is given. It performs no filtering
 * of its own — callers pass the ALREADY-filtered record set (e.g. the output of
 * {@link filterRecords}) so the export reflects exactly the records currently
 * visible under the active filters.
 *
 * The CSV contains a header row followed by one row per record, in the same
 * order as the input. Columns are described by `columns`, each `{ key, label }`
 * where `key` is the record field (dot-paths not supported) and `label` is the
 * header text. An optional `accessor(record)` on a column overrides field lookup
 * for computed/nested values.
 *
 * @param {Array<object>} filteredRecords - the currently filtered record set
 * @param {Array<{key?: string, label?: string, accessor?: function}>} columns
 * @returns {string} CSV text (header row only when there are no records)
 */
export const toCsv = (filteredRecords, columns) => {
  const cols = Array.isArray(columns) ? columns : [];
  const records = Array.isArray(filteredRecords) ? filteredRecords : [];

  const header = cols.map((col) => escapeCsvField(col.label !== undefined ? col.label : col.key));

  const lines = [header.join(',')];

  for (const record of records) {
    const row = cols.map((col) => {
      let value;
      if (typeof col.accessor === 'function') {
        value = col.accessor(record);
      } else if (record && typeof record === 'object' && col.key !== undefined) {
        value = record[col.key];
      }
      return escapeCsvField(value);
    });
    lines.push(row.join(','));
  }

  return lines.join('\r\n');
};

export default { filterRecords, toCsv };
