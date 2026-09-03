import React, { useState, useMemo, useCallback } from 'react';
import {
  Calendar, Download, Clock, CheckCircle, XCircle, AlertCircle,
  ChevronLeft, ChevronRight, Edit2, Plus, Save, X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import toast from 'react-hot-toast';

// ─── Constants ────────────────────────────────────────────────────────────────
const NORMAL_HOURS   = 9;   // hours before overtime kicks in
const DAY_NAMES      = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAY_SHORT      = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES    = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const toMinutes = (t) => {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  if (isNaN(h) || isNaN(m)) return null;
  return h * 60 + m;
};

const calcHours = (checkIn, checkOut) => {
  const inMin  = toMinutes(checkIn);
  const outMin = toMinutes(checkOut);
  if (inMin === null || outMin === null || outMin <= inMin) return { hours: 0, overtime: 0 };
  const hours    = Math.round(((outMin - inMin) / 60) * 10) / 10;
  const overtime = hours > NORMAL_HOURS ? Math.round((hours - NORMAL_HOURS) * 10) / 10 : 0;
  return { hours, overtime };
};

const fmt = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const today = () => new Date().toISOString().split('T')[0]; // YYYY-MM-DD

// ─── Mini Calendar ────────────────────────────────────────────────────────────
const MiniCalendar = ({ selectedDate, onSelect, markedDates }) => {
  const initDate   = selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date();
  const [year,  setYear]  = useState(initDate.getFullYear());
  const [month, setMonth] = useState(initDate.getMonth()); // 0-indexed

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const daysInMonth   = new Date(year, month + 1, 0).getDate();
  const firstWeekday  = new Date(year, month, 1).getDay(); // 0 = Sunday

  const cells = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const todayStr = today();

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, userSelect: 'none' }}>
      {/* Month/Year nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button onClick={prev} className="btn-icon" style={{ padding: 4 }} aria-label="Previous month">
          <ChevronLeft size={16} />
        </button>
        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
          {MONTH_NAMES[month]} {year}
        </span>
        <button onClick={next} className="btn-icon" style={{ padding: 4 }} aria-label="Next month">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {DAY_SHORT.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-muted)', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Date cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} />;
          const dateStr  = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const isToday  = dateStr === todayStr;
          const isSel    = dateStr === selectedDate;
          const mark     = markedDates[dateStr]; // { status } or undefined

          let dotColor = null;
          if (mark) {
            const colorMap = { present: 'var(--success)', absent: 'var(--danger)', 'half-day': 'var(--warning)', leave: 'var(--info)', late: 'var(--warning)' };
            dotColor = colorMap[mark.status] || 'var(--primary)';
          }

          return (
            <button
              key={dateStr}
              onClick={() => onSelect(dateStr)}
              style={{
                position: 'relative',
                width: '100%',
                aspectRatio: '1',
                minWidth: 28,
                border: isSel ? '2px solid var(--primary)' : isToday ? '2px solid var(--primary-light)' : '2px solid transparent',
                borderRadius: 8,
                background: isSel ? 'var(--primary)' : isToday ? 'var(--primary-light)' : 'transparent',
                color: isSel ? 'white' : isToday ? 'var(--primary)' : 'var(--text-primary)',
                fontSize: '0.8rem',
                fontWeight: isSel || isToday ? 700 : 400,
                cursor: 'pointer',
                padding: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
              aria-label={dateStr}
              aria-pressed={isSel}
            >
              {d}
              {dotColor && (
                <span style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: isSel ? 'rgba(255,255,255,0.8)' : dotColor,
                  flexShrink: 0,
                }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ─── Attendance Form Modal ────────────────────────────────────────────────────
const AttendanceFormModal = ({ date, existingRecord, onSave, onClose }) => {
  const [form, setForm] = useState({
    status:   existingRecord?.status   || 'present',
    checkIn:  existingRecord?.checkIn  || '09:00',
    checkOut: existingRecord?.checkOut || '18:00',
  });
  const [saving, setSaving] = useState(false);
  const [err,    setErr]    = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErr(''); };

  const { hours, overtime } = useMemo(() => {
    const noTime = ['absent', 'leave'].includes(form.status);
    if (noTime) return { hours: 0, overtime: 0 };
    return calcHours(form.checkIn, form.checkOut);
  }, [form.status, form.checkIn, form.checkOut]);

  const needsTime = !['absent', 'leave'].includes(form.status);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (needsTime) {
      if (!form.checkIn)  { setErr('Check-in time is required'); return; }
      if (!form.checkOut) { setErr('Check-out time is required'); return; }
      const inMin  = toMinutes(form.checkIn);
      const outMin = toMinutes(form.checkOut);
      if (outMin <= inMin) { setErr('Check-out must be after check-in'); return; }
    }
    setSaving(true);
    try {
      await onSave({
        date,
        status:   form.status,
        checkIn:  needsTime ? form.checkIn  : null,
        checkOut: needsTime ? form.checkOut : null,
      });
    } finally {
      setSaving(false);
    }
  };

  const d       = new Date(date + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];

  return (
    <form onSubmit={handleSubmit}>
      {/* Date info */}
      <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '12px 16px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 42, height: 42, borderRadius: 10, background: 'var(--primary)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 600, lineHeight: 1 }}>{MONTH_NAMES[d.getMonth()].slice(0,3).toUpperCase()}</span>
          <span style={{ color: 'white', fontSize: '1rem', fontWeight: 800, lineHeight: 1 }}>{d.getDate()}</span>
        </div>
        <div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>{dayName}, {fmt(date)}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {existingRecord ? 'Edit existing attendance record' : 'Add new attendance record'}
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="form-group" style={{ marginBottom: 16 }}>
        <label className="form-label">Attendance Status <span style={{ color: 'var(--danger)' }}>*</span></label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {[
            { value: 'present',  label: 'Present',  color: 'var(--success)' },
            { value: 'absent',   label: 'Absent',   color: 'var(--danger)'  },
            { value: 'half-day', label: 'Half Day', color: 'var(--warning)' },
            { value: 'leave',    label: 'On Leave', color: 'var(--info)'    },
            { value: 'late',     label: 'Late',     color: 'var(--warning)' },
          ].map(opt => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('status', opt.value)}
              style={{
                padding: '8px 4px',
                borderRadius: 8,
                border: `2px solid ${form.status === opt.value ? opt.color : 'var(--border)'}`,
                background: form.status === opt.value ? `${opt.color}18` : 'transparent',
                color: form.status === opt.value ? opt.color : 'var(--text-secondary)',
                fontSize: '0.8rem',
                fontWeight: form.status === opt.value ? 700 : 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Check In / Check Out — hidden for absent/leave */}
      {needsTime && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Check In <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="time"
              className="form-control"
              value={form.checkIn}
              onChange={e => set('checkIn', e.target.value)}
              required={needsTime}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 16 }}>
            <label className="form-label">Check Out <span style={{ color: 'var(--danger)' }}>*</span></label>
            <input
              type="time"
              className="form-control"
              value={form.checkOut}
              onChange={e => set('checkOut', e.target.value)}
              required={needsTime}
            />
          </div>
        </div>
      )}

      {/* Live calculation preview */}
      {needsTime && hours > 0 && (
        <div style={{ background: 'var(--surface-2)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', gap: 20 }}>
          <div style={{ fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-muted)' }}>Working hours: </span>
            <strong style={{ color: 'var(--success)' }}>{hours}h</strong>
          </div>
          {overtime > 0 && (
            <div style={{ fontSize: '0.8rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Overtime: </span>
              <strong style={{ color: 'var(--warning)' }}>+{overtime}h</strong>
            </div>
          )}
        </div>
      )}

      {err && (
        <div style={{ background: 'var(--danger-light)', border: '1px solid var(--danger)', borderRadius: 8, padding: '8px 12px', marginBottom: 14, fontSize: '0.8rem', color: 'var(--danger)' }}>
          {err}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 4 }}>
        <button type="button" className="btn btn-outline" onClick={onClose} disabled={saving}>
          <X size={14} /> Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          {saving
            ? <><span className="loading-spinner" style={{ width: 14, height: 14 }} /> Saving…</>
            : <><Save size={14} /> Save Attendance</>}
        </button>
      </div>
    </form>
  );
};

// ─── Selected Date Detail Card ─────────────────────────────────────────────────
const DateDetailCard = ({ date, record, onEdit, onAdd }) => {
  const d       = new Date(date + 'T00:00:00');
  const dayName = DAY_NAMES[d.getDay()];
  const isToday = date === today();

  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Selected Date
          </div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-primary)', marginTop: 2 }}>
            {dayName}
            {isToday && <span style={{ marginLeft: 8, fontSize: '0.7rem', background: 'var(--primary)', color: 'white', borderRadius: 4, padding: '1px 6px', verticalAlign: 'middle' }}>Today</span>}
          </div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: 2 }}>{fmt(date)}</div>
        </div>
        {record ? (
          <button className="btn btn-outline btn-sm" onClick={onEdit}>
            <Edit2 size={13} /> Edit
          </button>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={13} /> Add Attendance
          </button>
        )}
      </div>

      {record ? (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
          {[
            { label: 'Status',        value: <Badge status={record.status} /> },
            { label: 'Check In',      value: record.checkIn  || '—', highlight: 'var(--success)' },
            { label: 'Check Out',     value: record.checkOut || '—', highlight: 'var(--danger)'  },
            { label: 'Working Hours', value: record.hours ? `${record.hours}h` : '—', highlight: record.hours > 0 ? 'var(--primary)' : null },
            { label: 'Overtime',      value: record.overtime > 0 ? `+${record.overtime}h` : '—', highlight: record.overtime > 0 ? 'var(--warning)' : null },
          ].map(({ label, value, highlight }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {label}
              </span>
              <span style={{ fontSize: '0.875rem', fontWeight: 500, color: highlight || 'var(--text-primary)' }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: '2rem', marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 12 }}>
            No attendance record for this date
          </div>
          <button className="btn btn-primary btn-sm" onClick={onAdd}>
            <Plus size={13} /> Add Attendance
          </button>
        </div>
      )}
    </div>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────────
const EmployeeAttendance = () => {
  const { attendanceData, selfMarkAttendance } = useApp();
  const { user } = useAuth();

  const todayStr       = today();
  const currentMonth   = todayStr.slice(0, 7);

  const [selectedDate,  setSelectedDate]  = useState(todayStr);
  const [monthFilter,   setMonthFilter]   = useState(currentMonth);
  const [statusFilter,  setStatusFilter]  = useState('');
  const [modalOpen,     setModalOpen]     = useState(false);

  // Only this employee's attendance — match by userId or email
  const myAttendance = useMemo(() =>
    attendanceData.filter(a =>
      (a.userId  && a.userId?.toString()  === user?.id?.toString()) ||
      (a.email   && a.email   === user?.email) ||
      (a.employeeId && a.employeeId?.toString() === user?.id?.toString())
    ),
    [attendanceData, user]
  );

  // Build a quick lookup map: dateStr → record
  const recordByDate = useMemo(() => {
    const map = {};
    myAttendance.forEach(a => { map[a.date] = a; });
    return map;
  }, [myAttendance]);

  // Record for currently selected date
  const selectedRecord = recordByDate[selectedDate] || null;

  // Filtered history (month + status)
  const filtered = useMemo(() => {
    let list = [...myAttendance];
    if (monthFilter)  list = list.filter(a => a.date?.startsWith(monthFilter));
    if (statusFilter) list = list.filter(a => a.status === statusFilter);
    return list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [myAttendance, monthFilter, statusFilter]);

  // Summary — scoped to the selected month (or all if no filter)
  const summaryBase = monthFilter ? filtered : myAttendance;
  const summary = useMemo(() => ({
    present:  summaryBase.filter(a => a.status === 'present').length,
    absent:   summaryBase.filter(a => a.status === 'absent').length,
    halfDay:  summaryBase.filter(a => a.status === 'half-day' || a.status === 'late').length,
    leave:    summaryBase.filter(a => a.status === 'leave').length,
    totalHrs: summaryBase.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1),
  }), [summaryBase]);

  const handleSave = useCallback(async (payload) => {
    try {
      await selfMarkAttendance(payload);
      toast.success('Attendance saved successfully');
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    }
  }, [selfMarkAttendance]);

  const handleExport = () => {
    const header = 'Date,Day,Check In,Check Out,Working Hours,Overtime,Status\n';
    const rows = filtered.map(a => {
      const d = new Date(a.date + 'T00:00:00');
      return `${a.date},${DAY_NAMES[d.getDay()]},${a.checkIn || ''},${a.checkOut || ''},${a.hours || 0},${a.overtime || 0},${a.status}`;
    }).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `my_attendance_${monthFilter || 'all'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      {/* Page header */}
      <div className="page-header">
        <div className="page-header-top">
          <div>
            <h1 className="page-title">My Attendance</h1>
            <p className="page-subtitle">Track and manage your personal attendance</p>
          </div>
          <button className="btn btn-outline btn-sm" onClick={handleExport} disabled={filtered.length === 0}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { icon: CheckCircle, label: 'Present Days',    value: summary.present,         color: 'var(--success)', bg: 'var(--success-light)' },
          { icon: XCircle,     label: 'Absent Days',     value: summary.absent,          color: 'var(--danger)',  bg: 'var(--danger-light)'  },
          { icon: AlertCircle, label: 'Half Day / Late', value: summary.halfDay,         color: 'var(--warning)', bg: 'var(--warning-light)' },
          { icon: Calendar,    label: 'Leave Days',      value: summary.leave,           color: 'var(--info)',    bg: 'var(--info-light)'    },
          { icon: Clock,       label: 'Total Hours',     value: `${summary.totalHrs}h`,  color: 'var(--primary)', bg: 'var(--primary-light)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <s.icon size={20} color={s.color} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Calendar + Detail panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, marginBottom: 20 }}>
        {/* Calendar */}
        <div>
          <MiniCalendar
            selectedDate={selectedDate}
            onSelect={setSelectedDate}
            markedDates={recordByDate}
          />
          <div style={{ marginTop: 10, display: 'flex', flexWrap: 'wrap', gap: '6px 12px', padding: '0 2px' }}>
            {[
              { color: 'var(--success)', label: 'Present'  },
              { color: 'var(--danger)',  label: 'Absent'   },
              { color: 'var(--warning)', label: 'Half / Late' },
              { color: 'var(--info)',    label: 'Leave'    },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: l.color, display: 'inline-block' }} />
                {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Selected date detail */}
        <DateDetailCard
          date={selectedDate}
          record={selectedRecord}
          onEdit={() => setModalOpen(true)}
          onAdd={() => setModalOpen(true)}
        />
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Month:</label>
            <input
              type="month"
              className="form-control"
              style={{ width: 160 }}
              value={monthFilter}
              onChange={e => setMonthFilter(e.target.value)}
            />
          </div>
          <select
            className="form-control form-select"
            style={{ width: 160 }}
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="half-day">Half Day</option>
            <option value="leave">On Leave</option>
            <option value="late">Late</option>
          </select>
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} records · {filtered.filter(a => a.status === 'present').length} present ·{' '}
            {filtered.reduce((s, a) => s + (Number(a.hours) || 0), 0).toFixed(1)}h worked
          </span>
        </div>
      </div>

      {/* Attendance History Table */}
      {myAttendance.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
          <div className="empty-state-title">No attendance records yet</div>
          <div className="empty-state-desc">
            Select a date from the calendar above and add your first attendance record
          </div>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => { setSelectedDate(todayStr); setModalOpen(true); }}>
            <Plus size={14} /> Mark Today's Attendance
          </button>
        </div>
      ) : (
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Day</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Working Hours</th>
                <th>Overtime</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length > 0 ? filtered.map((a) => {
                const d       = a.date ? new Date(a.date + 'T00:00:00') : null;
                const dayName = d ? DAY_NAMES[d.getDay()] : '—';
                const isSel   = a.date === selectedDate;

                return (
                  <tr
                    key={a._id || a.date}
                    onClick={() => setSelectedDate(a.date)}
                    style={{ cursor: 'pointer', background: isSel ? 'var(--primary-light)' : undefined }}
                  >
                    <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{fmt(a.date)}</td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{dayName}</td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {a.checkIn
                        ? <span style={{ color: 'var(--success)', fontWeight: 500 }}>{a.checkIn}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.875rem' }}>
                      {a.checkOut
                        ? <span style={{ color: 'var(--danger)', fontWeight: 500 }}>{a.checkOut}</span>
                        : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                      {a.hours ? `${a.hours}h` : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                    </td>
                    <td style={{ fontSize: '0.875rem', color: a.overtime > 0 ? 'var(--warning)' : 'var(--text-muted)', fontWeight: a.overtime > 0 ? 600 : 400 }}>
                      {a.overtime > 0 ? `+${a.overtime}h` : '—'}
                    </td>
                    <td><Badge status={a.status} /></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button
                        className="btn-icon primary"
                        title="Edit attendance"
                        onClick={() => { setSelectedDate(a.date); setModalOpen(true); }}
                      >
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>
                    No records found for the selected filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedRecord ? 'Edit Attendance' : 'Add Attendance'}
        size="md"
      >
        <AttendanceFormModal
          date={selectedDate}
          existingRecord={selectedRecord}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
};

export default EmployeeAttendance;
