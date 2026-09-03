import React, { useState, useMemo, useCallback } from 'react';
import { Calendar, Download, CheckCircle, XCircle, Clock, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import Avatar from '../../components/shared/Avatar';
import Modal from '../../components/shared/Modal';
import AIChatPanel from '../../components/ai/AIChatPanel';
import { useAI } from '../../hooks/useAI';
import toast from 'react-hot-toast';

const TODAY = new Date().toISOString().split('T')[0];

const AttendanceModal = ({ employee, record, onSave, onClose }) => {
  const [form, setForm] = useState(record || { status: 'present', checkIn: '09:00', checkOut: '18:00', late: false, overtime: 0 });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave({ ...form, employeeId: employee._id, name: employee.name, email: employee.email || '', department: employee.department, date: TODAY }); }}>
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
        <Avatar name={employee.name} size="md" />
        <div><div style={{ fontWeight: 600 }}>{employee.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{employee.id} · {employee.department}</div></div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="present">Present</option>
            <option value="absent">Absent</option>
            <option value="late">Late</option>
            <option value="half-day">Half Day</option>
            <option value="leave">On Leave</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Check In</label>
          <input type="time" className="form-control" value={form.checkIn || ''} onChange={e => set('checkIn', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Check Out</label>
          <input type="time" className="form-control" value={form.checkOut || ''} onChange={e => set('checkOut', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Overtime (hours)</label>
          <input type="number" className="form-control" step="0.5" min="0" value={form.overtime} onChange={e => set('overtime', Number(e.target.value))} />
        </div>
      </div>
      <div className="form-check" style={{ marginBottom: 20 }}>
        <input type="checkbox" id="late" checked={form.late} onChange={e => set('late', e.target.checked)} />
        <label htmlFor="late">Mark as late arrival</label>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">Save Attendance</button>
      </div>
    </form>
  );
};

const DailyAttendance = () => {
  const { employees, attendanceData, markAttendance, departments } = useApp();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(TODAY);
  const [deptFilter, setDeptFilter] = useState('');
  const [editEmp, setEditEmp] = useState(null);

  // AI
  const ai = useAI(user);
  const handleAttendanceAI = useCallback(async (message) => {
    const chatResult = await ai.adminChat(message, { employees, attendance: attendanceData, leave: [], payroll: [], performance: [] });
    if (!chatResult) return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
    if (!chatResult.success) return chatResult.message || 'AI Assistant is temporarily unavailable. Please try again.';
    return chatResult.answer || 'I could not generate a response. Please try rephrasing your question.';
  }, [ai, attendanceData, employees]);

  const dayAttendance = useMemo(() =>
    attendanceData.filter(a => a.date === selectedDate),
    [attendanceData, selectedDate]
  );

  const getRecord = (empId) => dayAttendance.find(a => a.employeeId === empId || a.employeeId === empId?.toString());

  const filteredEmps = employees.filter(e => !deptFilter || e.department === deptFilter);

  const stats = {
    present: dayAttendance.filter(a => a.status === 'present').length,
    absent: dayAttendance.filter(a => a.status === 'absent').length,
    late: dayAttendance.filter(a => a.status === 'late').length,
    leave: dayAttendance.filter(a => a.status === 'leave').length,
  };

  const handleSave = async (record) => {
    const hours = record.checkIn && record.checkOut ? (() => {
      const [hi, mi] = record.checkIn.split(':').map(Number);
      const [ho, mo] = record.checkOut.split(':').map(Number);
      return Number(((ho * 60 + mo - hi * 60 - mi) / 60).toFixed(1));
    })() : 0;
    try {
      await markAttendance({ ...record, hours });
      toast.success(`Attendance marked for ${record.name}`);
    } catch (err) {
      toast.error(err.message || 'Failed to save attendance');
    }
    setEditEmp(null);
  };

  const handleBulkMark = async (status) => {
    const promises = filteredEmps.map(emp => {
      const record = {
        date: selectedDate,
        employeeId: emp._id,
        name: emp.name,
        email: emp.email,
        department: emp.department,
        checkIn: status === 'present' ? '09:00 AM' : null,
        checkOut: status === 'present' ? '06:00 PM' : null,
        hours: status === 'present' ? 9 : 0,
        status,
        late: false,
        overtime: 0,
      };
      return markAttendance(record);
    });
    await Promise.allSettled(promises);
    toast.success(`Bulk marked ${filteredEmps.length} employees as ${status}`);
  };

  const handleExport = () => {
    toast.success('Attendance exported');
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Attendance</span><span className="breadcrumb-sep">/</span><span>Daily Attendance</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Daily Attendance</h1>
            <p className="page-subtitle">Track and manage employee attendance</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={() => handleBulkMark('present')}><CheckCircle size={14} /> Mark All Present</button>
            <button className="btn btn-outline btn-sm" onClick={handleExport}><Download size={14} /> Export</button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Present', value: stats.present, color: 'var(--success)', bg: 'var(--success-light)' },
          { label: 'Absent', value: stats.absent, color: 'var(--danger)', bg: 'var(--danger-light)' },
          { label: 'Late', value: stats.late, color: 'var(--warning)', bg: 'var(--warning-light)' },
          { label: 'On Leave', value: stats.leave, color: 'var(--info)', bg: 'var(--info-light)' },
        ].map(s => (
          <div key={s.label} className="card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: '1.2rem', fontWeight: 700, color: s.color }}>{s.value}</span>
            </div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} style={{ color: 'var(--text-muted)' }} />
            <input type="date" className="form-control" style={{ width: 160 }} value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
          </div>
          <select className="form-control form-select" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Employee</th><th>ID</th><th>Department</th><th>Check In</th><th>Check Out</th>
              <th>Hours</th><th>Status</th><th>Late</th><th>Overtime</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredEmps.map(emp => {
              const rec = getRecord(emp._id);
              return (
                <tr key={emp._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Avatar name={emp.name} size="sm" />
                      <span style={{ fontWeight: 500, fontSize: '0.875rem' }}>{emp.name}</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{String(emp._id).slice(-6).toUpperCase()}</td>
                  <td style={{ fontSize: '0.875rem' }}>{emp.department}</td>
                  <td style={{ fontSize: '0.875rem' }}>{rec?.checkIn || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: '0.875rem' }}>{rec?.checkOut || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td style={{ fontSize: '0.875rem' }}>{rec?.hours ? `${rec.hours}h` : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  <td>{rec ? <Badge status={rec.status} /> : <Badge status="absent" />}</td>
                  <td>{rec?.late ? <span style={{ color: 'var(--warning)', fontSize: '0.8rem', fontWeight: 600 }}>Late</span> : <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>—</span>}</td>
                  <td style={{ fontSize: '0.875rem' }}>{rec?.overtime ? `${rec.overtime}h` : '—'}</td>
                  <td>
                    <button className="btn-icon primary" onClick={() => setEditEmp({ emp, record: rec })} title="Edit Attendance">
                      <Edit2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {editEmp && (
        <Modal open={true} onClose={() => setEditEmp(null)} title="Mark Attendance" size="md">
          <AttendanceModal employee={editEmp.emp} record={editEmp.record} onSave={handleSave} onClose={() => setEditEmp(null)} />
        </Modal>
      )}

      {/* AI Attendance Analysis */}
      <div style={{ marginTop: 24 }}>
        <AIChatPanel
          title="AI Attendance Analysis"
          onSend={handleAttendanceAI}
          loading={ai.loading}
          suggestions={[
            'Analyze attendance for this period',
            'Which department has the most absences?',
            'How is the overall attendance rate?',
            'Show overtime trends',
          ]}
          placeholder="Ask about attendance patterns, absenteeism, overtime..."
        />
      </div>
    </div>
  );
};

export default DailyAttendance;
