import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Badge from '../../components/shared/Badge';
import { SkeletonTable } from '../../components/shared/SkeletonLoader';

/* ------------------------------------------------------------------ *
 * Pure date + recurrence helpers.
 *
 * These mirror the backend `services/holidaySync.js` logic (the frontend
 * cannot import backend modules). Dates are handled as 'YYYY-MM-DD'
 * strings using UTC arithmetic to avoid timezone/DST drift.
 * ------------------------------------------------------------------ */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_LABELS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const WEEKDAY_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_LABELS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// Badge colour per Holiday_Type (reuses existing palette classes).
const TYPE_VARIANT = {
  Weekly: 'badge-teal',
  Monthly: 'badge-purple',
  Festival: 'badge-orange',
  Custom: 'badge-info',
};

function parseISODate(str) {
  if (typeof str !== 'string' || !DATE_RE.test(str)) return null;
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    return null;
  }
  return dt;
}

function formatISODate(dt) {
  const y = String(dt.getUTCFullYear()).padStart(4, '0');
  const m = String(dt.getUTCMonth() + 1).padStart(2, '0');
  const d = String(dt.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(dt, days) {
  return new Date(dt.getTime() + days * 86400000);
}

// Today as a 'YYYY-MM-DD' string in local terms, normalised to UTC midnight.
function todayISO() {
  const now = new Date();
  return formatISODate(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/**
 * Expand a Holiday_Rule into the concrete 'YYYY-MM-DD' dates it produces within
 * an inclusive range. Festival/Custom use the fixed `date`; Weekly expands by
 * recurrence.dayOfWeek (0-6); Monthly by recurrence.dayOfMonth (1-31). (Req 6.3)
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
  return Array.from(new Set(results)).sort();
}

/**
 * Compute the next applicable date on/after `today` for a holiday, used to order
 * the Upcoming Holidays list. For Festival/Custom this is the fixed date (when it
 * is today or later); for Weekly/Monthly it is the earliest recurrence occurrence
 * within the next ~15 months. Returns null when there is no upcoming occurrence.
 */
function nextApplicableDate(holiday, today) {
  const start = parseISODate(today);
  if (!start) return null;

  if (holiday.type === 'Festival' || holiday.type === 'Custom') {
    const dt = parseISODate(holiday.date);
    if (dt && dt.getTime() >= start.getTime()) return holiday.date;
    return null;
  }
  // Weekly/Monthly: look ahead over a bounded window for the first occurrence.
  const horizon = formatISODate(addDays(start, 460));
  const occurrences = expandHolidayRule(holiday, today, horizon);
  return occurrences.length > 0 ? occurrences[0] : null;
}

// Friendly, locale-independent 'Mon, 15 Jan 2025' style date label.
function formatDateLabel(dateStr) {
  const dt = parseISODate(dateStr);
  if (!dt) return dateStr;
  return `${WEEKDAY_SHORT[dt.getUTCDay()]}, ${dt.getUTCDate()} ${MONTH_LABELS[dt.getUTCMonth()].slice(0, 3)} ${dt.getUTCFullYear()}`;
}

// Describe a holiday's rule for the upcoming list (e.g. "Every Sunday").
function ruleSummary(holiday) {
  switch (holiday.type) {
    case 'Weekly': {
      const dow = holiday.recurrence ? holiday.recurrence.dayOfWeek : null;
      return Number.isInteger(dow) ? `Every ${WEEKDAY_LABELS[dow]}` : 'Weekly';
    }
    case 'Monthly': {
      const dom = holiday.recurrence ? holiday.recurrence.dayOfMonth : null;
      return Number.isInteger(dom) ? `Day ${dom} of every month` : 'Monthly';
    }
    case 'Festival':
      return 'Festival';
    case 'Custom':
      return 'Custom';
    default:
      return holiday.type || '';
  }
}

const HolidayCalendar = () => {
  const { holidays } = useApp();

  // Loading heuristic consistent with other list pages: show the skeleton while
  // the AppContext holidays slice is still empty on first paint.
  const [loaded, setLoaded] = useState(false);
  React.useEffect(() => {
    // Mark as loaded once the context has settled (data arrives or confirms empty).
    const t = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(t);
  }, []);

  // Displayed month state (defaults to the current month).
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth()); // 0-11

  const today = todayISO();
  const activeHolidays = useMemo(
    () => (Array.isArray(holidays) ? holidays.filter(h => h && h.status !== 'inactive') : []),
    [holidays]
  );

  const goPrevMonth = () => {
    setViewMonth(m => {
      if (m === 0) { setViewYear(y => y - 1); return 11; }
      return m - 1;
    });
  };
  const goNextMonth = () => {
    setViewMonth(m => {
      if (m === 11) { setViewYear(y => y + 1); return 0; }
      return m + 1;
    });
  };
  const goToday = () => {
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
  };

  // Build the calendar grid for the displayed month, mapping each day to the
  // holidays that fall on it (Weekly/Monthly recurrences expanded within the
  // visible range) (Req 6.1, 6.3).
  const { weeks, holidaysByDate } = useMemo(() => {
    const firstOfMonth = new Date(Date.UTC(viewYear, viewMonth, 1));
    const daysInMonth = new Date(Date.UTC(viewYear, viewMonth + 1, 0)).getUTCDate();
    const rangeStart = formatISODate(firstOfMonth);
    const rangeEnd = formatISODate(new Date(Date.UTC(viewYear, viewMonth, daysInMonth)));

    // Map 'YYYY-MM-DD' -> [holiday, ...] for every occurrence in the month.
    const byDate = {};
    for (const h of activeHolidays) {
      const occurrences = expandHolidayRule(h, rangeStart, rangeEnd);
      for (const d of occurrences) {
        (byDate[d] = byDate[d] || []).push(h);
      }
    }

    // Lay out a 6-row grid starting from the Sunday on/before the 1st.
    const leadingBlanks = firstOfMonth.getUTCDay(); // 0 (Sun) .. 6 (Sat)
    const cells = [];
    for (let i = 0; i < leadingBlanks; i++) cells.push(null);
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(formatISODate(new Date(Date.UTC(viewYear, viewMonth, day))));
    }
    while (cells.length % 7 !== 0) cells.push(null);

    const rows = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

    return { weeks: rows, holidaysByDate: byDate };
  }, [activeHolidays, viewYear, viewMonth]);

  // Upcoming Holidays: each holiday's next applicable date on/after today,
  // ordered ascending (Req 6.2).
  const upcoming = useMemo(() => {
    return activeHolidays
      .map(h => ({ holiday: h, date: nextApplicableDate(h, today) }))
      .filter(x => x.date !== null)
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  }, [activeHolidays, today]);

  const cellBase = {
    minHeight: 92,
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: 6,
    background: 'var(--surface)',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Holidays</span>
          <span className="breadcrumb-sep">/</span>
          <span>Holiday Calendar</span>
        </div>
        <h1 className="page-title">Holiday Calendar</h1>
        <p className="page-subtitle">Holidays shown on their applicable dates, plus upcoming holidays</p>
      </div>

      {/* Calendar (Req 6.1, 6.3) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarDays size={18} /> {MONTH_LABELS[viewMonth]} {viewYear}
          </h3>
          <div className="table-actions">
            <button className="btn btn-outline btn-sm" onClick={goToday}>Today</button>
            <button className="btn-icon" onClick={goPrevMonth} title="Previous month"><ChevronLeft size={15} /></button>
            <button className="btn-icon" onClick={goNextMonth} title="Next month"><ChevronRight size={15} /></button>
          </div>
        </div>

        {!loaded ? (
          <SkeletonTable rows={6} cols={7} />
        ) : (
          <div style={{ padding: 4 }}>
            {/* Weekday headings */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
              {WEEKDAY_SHORT.map(d => (
                <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', padding: '4px 0' }}>
                  {d}
                </div>
              ))}
            </div>

            {/* Day grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {weeks.map((week, wi) => (
                <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
                  {week.map((dateStr, di) => {
                    if (!dateStr) {
                      return <div key={di} style={{ ...cellBase, background: 'var(--bg-elevated)', border: '1px solid transparent' }} />;
                    }
                    const dayNum = parseISODate(dateStr).getUTCDate();
                    const isToday = dateStr === today;
                    const dayHolidays = holidaysByDate[dateStr] || [];
                    return (
                      <div
                        key={di}
                        style={{
                          ...cellBase,
                          borderColor: isToday ? 'var(--primary)' : 'var(--border)',
                          boxShadow: isToday ? '0 0 0 1px var(--primary)' : 'none',
                        }}
                      >
                        <div style={{
                          fontSize: '0.8rem',
                          fontWeight: isToday ? 700 : 500,
                          color: isToday ? 'var(--primary)' : 'var(--text-secondary)',
                          alignSelf: 'flex-end',
                        }}>
                          {dayNum}
                        </div>
                        {dayHolidays.map((h, hi) => (
                          <div
                            key={(h._id || h.id || h.holidayName) + '-' + hi}
                            title={`${h.holidayName} (${ruleSummary(h)})`}
                            className={`badge ${TYPE_VARIANT[h.type] || 'badge-gray'}`}
                            style={{
                              fontSize: '0.68rem',
                              padding: '2px 6px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                              display: 'block',
                            }}
                          >
                            {h.holidayName}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upcoming Holidays (Req 6.2) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={18} /> Upcoming Holidays
          </h3>
          <span className="badge badge-info">{upcoming.length}</span>
        </div>

        {!loaded ? (
          <SkeletonTable rows={4} cols={4} />
        ) : upcoming.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No upcoming holidays</div>
            <div className="empty-state-desc">Holidays on or after today will appear here.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Holiday</th>
                  <th>Type</th>
                  <th>Next Date</th>
                  <th>Recurrence</th>
                  <th>Paid</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map(({ holiday, date }, i) => (
                  <tr key={(holiday._id || holiday.id || holiday.holidayName) + '-' + i}>
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{holiday.holidayName}</td>
                    <td>
                      <span className={`badge ${TYPE_VARIANT[holiday.type] || 'badge-gray'}`} style={{ fontSize: '0.75rem' }}>
                        {holiday.type}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>{formatDateLabel(date)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{ruleSummary(holiday)}</td>
                    <td>
                      <Badge
                        label={holiday.paidStatus || 'Paid'}
                        variant={holiday.paidStatus === 'Unpaid' ? 'badge-gray' : 'badge-success'}
                        dot={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HolidayCalendar;
