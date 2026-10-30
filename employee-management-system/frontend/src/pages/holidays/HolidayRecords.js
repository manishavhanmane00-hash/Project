import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Eye, Plus, Pencil, Trash2,
  Printer, Download, AlertCircle, CalendarDays,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { holidayAPI } from '../../services/api';
import { filterRecords, toCsv } from '../../utils/recordFilters';
import Badge from '../../components/shared/Badge';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Pagination from '../../components/shared/Pagination';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Holiday_Type options (Req 5.4).
const HOLIDAY_TYPES = ['Weekly', 'Monthly', 'Festival', 'Custom'];
const PAID_OPTIONS = ['Paid', 'Unpaid'];

const DAYS_OF_WEEK = [
  { value: 0, label: 'Sunday' },
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
];

const recordId = (r) => (r?._id || r?.id || '').toString();
const shortId = (r) => recordId(r).slice(-8).toUpperCase();

// Needs a fixed date (Festival/Custom) vs recurrence (Weekly/Monthly).
const needsDate = (type) => type === 'Festival' || type === 'Custom';

// Human-readable Holiday_Rule summary for list/detail/print/export.
const ruleSummary = (h) => {
  if (!h) return '';
  if (h.type === 'Weekly') {
    const d = DAYS_OF_WEEK.find(x => x.value === Number(h.recurrence?.dayOfWeek));
    return d ? `Every ${d.label}` : 'Weekly';
  }
  if (h.type === 'Monthly') {
    const dom = h.recurrence?.dayOfMonth;
    return (dom !== null && dom !== undefined && dom !== '') ? `Day ${dom} of every month` : 'Monthly';
  }
  return h.date || '';
};

const emptyForm = {
  holidayName: '',
  type: '',
  date: '',
  dayOfWeek: '',
  dayOfMonth: '',
  description: '',
  paidStatus: 'Paid',
  status: 'active',
  applicableAll: true,
  applicableEmployees: [],
};

const HolidayRecords = () => {
  const { holidays, addHoliday, updateHoliday, deleteHoliday, employees } = useApp();
  const { isAdmin } = useAuth();

  // ── Local list state (skeleton + retain last data on error) ───────────────
  const [records, setRecords] = useState(holidays);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters / pagination ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [viewHoliday, setViewHoliday] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editHoliday, setEditHoliday] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = isAdmin();

  // ── Load holidays with loading + error handling (Req 5.1, 17.1, 17.3) ─────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await holidayAPI.getAll();
      if (data.success) {
        setRecords(data.data);
      } else {
        throw new Error(data.message || 'Failed to load holidays');
      }
    } catch (err) {
      // Retain the last successfully loaded records.
      setError(err.response?.data?.message || err.message || 'Failed to load holidays');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep local list in sync with context mutations (add/edit/delete).
  useEffect(() => { setRecords(holidays); }, [holidays]);

  // ── Filtering (Req 5.1 / 12.1) via shared selector; type field = 'type' ───
  const filtered = useMemo(() => {
    const list = filterRecords(
      records,
      { search, status: statusFilter, type: typeFilter },
      { nameField: 'holidayName', statusField: 'status', typeField: 'type' },
    );
    return [...list].sort((a, b) => (a.holidayName || '').localeCompare(b.holidayName || ''));
  }, [records, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const employeeName = useCallback(
    (empId) => {
      const emp = employees.find(e => e.id === empId || e._id === empId);
      return emp?.name || empId;
    },
    [employees],
  );

  const applicableSummary = (h) => {
    if (h.applicableAll) return 'All employees';
    const list = h.applicableEmployees || [];
    if (list.length === 0) return 'None';
    return `${list.length} employee${list.length === 1 ? '' : 's'}`;
  };

  // ── Add / Edit ─────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditHoliday(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (h) => {
    setEditHoliday(h);
    setForm({
      holidayName: h.holidayName || '',
      type: h.type || '',
      date: h.date || '',
      dayOfWeek: h.recurrence?.dayOfWeek ?? '',
      dayOfMonth: h.recurrence?.dayOfMonth ?? '',
      description: h.description || '',
      paidStatus: h.paidStatus || 'Paid',
      status: h.status || 'active',
      applicableAll: h.applicableAll ?? true,
      applicableEmployees: h.applicableEmployees || [],
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErrors(e => ({ ...e, [k]: '' }));
  };

  const toggleEmployee = (empId) => {
    setForm(f => {
      const exists = f.applicableEmployees.includes(empId);
      return {
        ...f,
        applicableEmployees: exists
          ? f.applicableEmployees.filter(id => id !== empId)
          : [...f.applicableEmployees, empId],
      };
    });
  };

  // Mirror Property 12: name + type present and a valid rule for the type.
  const validateForm = () => {
    const errs = {};
    if (!form.holidayName.trim()) errs.holidayName = 'Enter a holiday name';
    if (!form.type) errs.type = 'Select a holiday type';

    if (needsDate(form.type)) {
      if (!form.date) errs.date = 'Select a date';
    } else if (form.type === 'Weekly') {
      if (form.dayOfWeek === '' || form.dayOfWeek === null) errs.dayOfWeek = 'Select a day of week';
    } else if (form.type === 'Monthly') {
      const dom = Number(form.dayOfMonth);
      if (form.dayOfMonth === '' || Number.isNaN(dom) || dom < 1 || dom > 31) {
        errs.dayOfMonth = 'Enter a day of month (1-31)';
      }
    }

    if (!form.applicableAll && form.applicableEmployees.length === 0) {
      errs.applicableEmployees = 'Select at least one employee or choose all';
    }
    return errs;
  };

  const buildPayload = () => {
    const payload = {
      holidayName: form.holidayName.trim(),
      type: form.type,
      description: form.description,
      paidStatus: form.paidStatus,
      status: form.status,
      applicableAll: form.applicableAll,
      applicableEmployees: form.applicableAll ? [] : form.applicableEmployees,
      date: needsDate(form.type) ? form.date : null,
      recurrence: {
        dayOfWeek: form.type === 'Weekly' ? Number(form.dayOfWeek) : null,
        dayOfMonth: form.type === 'Monthly' ? Number(form.dayOfMonth) : null,
      },
    };
    return payload;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editHoliday) {
        await updateHoliday(recordId(editHoliday), payload);
        toast.success('Holiday updated successfully');
      } else {
        await addHoliday(payload);
        toast.success('Holiday added successfully');
      }
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err) {
      // Retain the user's entered values on backend error (Req 17.2).
      toast.error(err.response?.data?.message || err.message || 'Failed to save holiday');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteHoliday(recordId(deleteTarget));
      toast.success('Holiday deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete holiday');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export (Req 12.2) — exports the currently filtered records ─────────────
  const handleExport = () => {
    const csv = toCsv(filtered, [
      { key: '_id', label: 'ID', accessor: shortId },
      { key: 'holidayName', label: 'Holiday Name' },
      { key: 'type', label: 'Type' },
      { key: 'rule', label: 'Rule', accessor: ruleSummary },
      { key: 'paidStatus', label: 'Paid Status' },
      { key: 'status', label: 'Status' },
      { key: 'applicable', label: 'Applicable', accessor: applicableSummary },
      { key: 'description', label: 'Description' },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `holidays-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? '' : 's'}`);
  };

  // ── Print (Req 12.3) — printable rendering of the currently filtered records ─
  const handlePrint = () => {
    const rows = filtered.map(h => `
      <tr>
        <td>${shortId(h)}</td>
        <td>${h.holidayName || ''}</td>
        <td>${h.type || ''}</td>
        <td>${ruleSummary(h)}</td>
        <td>${h.paidStatus || ''}</td>
        <td>${applicableSummary(h)}</td>
        <td>${h.status || ''}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Unable to open print window'); return; }
    win.document.write(`
      <html>
        <head>
          <title>Holidays</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 24px; color: #111; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            p { color: #666; font-size: 12px; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            th, td { border: 1px solid #ddd; padding: 8px; font-size: 12px; text-align: left; }
            th { background: #f3f4f6; }
          </style>
        </head>
        <body>
          <h1>Holidays</h1>
          <p>${filtered.length} record(s) · Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>ID</th><th>Name</th><th>Type</th><th>Rule</th><th>Paid</th><th>Applicable</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function () { window.print(); }</script>
        </body>
      </html>`);
    win.document.close();
  };

  const activeCount = records.filter(h => h.status === 'active').length;

  if (loading) return <SkeletonLoader />;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Holidays</span><span className="breadcrumb-sep">/</span><span>Holiday Records</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Holiday Records</h1>
            <p className="page-subtitle">{activeCount} active holiday{activeCount === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handlePrint} title="Print filtered records"><Printer size={14} /> Print</button>
            <button className="btn btn-outline" onClick={handleExport} title="Export filtered records"><Download size={14} /> Export</button>
            {canManage && <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Holiday</button>}
          </div>
        </div>
      </div>

      {/* Error banner — shown alongside the retained last-loaded data */}
      {error && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: '3px solid var(--danger)' }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--danger)', flex: 1 }}>{error}</span>
          <button className="btn btn-outline btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Holidays', value: records.length, color: 'var(--primary)' },
          { label: 'Active', value: activeCount, color: 'var(--success)' },
          { label: 'Recurring', value: records.filter(h => h.type === 'Weekly' || h.type === 'Monthly').length, color: 'var(--warning)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input className="form-control" placeholder="Search by name or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <select className="form-control form-select" style={{ width: 160 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Holiday Name</th><th>Type</th><th>Rule</th>
              <th>Paid</th><th>Applicable</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(h => (
              <tr key={recordId(h)}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shortId(h)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <CalendarDays size={16} color="var(--primary)" />
                    <span style={{ fontWeight: 600, fontSize: '0.875rem' }}>{h.holidayName}</span>
                  </div>
                </td>
                <td><span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{h.type}</span></td>
                <td style={{ fontSize: '0.85rem' }}>{ruleSummary(h)}</td>
                <td><span className={`badge ${h.paidStatus === 'Paid' ? 'badge-success' : 'badge-gray'}`} style={{ fontSize: '0.75rem' }}>{h.paidStatus}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{applicableSummary(h)}</td>
                <td><Badge status={h.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon primary" onClick={() => setViewHoliday(h)} title="View Details"><Eye size={13} /></button>
                    {canManage && (
                      <>
                        <button className="btn-icon" onClick={() => openEdit(h)} title="Edit"><Pencil size={13} /></button>
                        <button className="btn-icon danger" onClick={() => setDeleteTarget(h)} title="Delete"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No holidays found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* View Modal */}
      {viewHoliday && (
        <Modal open={true} onClose={() => setViewHoliday(null)} title="Holiday Details" size="md"
          footer={<button className="btn btn-outline" onClick={() => setViewHoliday(null)}>Close</button>}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
            <CalendarDays size={28} color="var(--primary)" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewHoliday.holidayName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{viewHoliday.type} · {ruleSummary(viewHoliday)}</div>
              <Badge status={viewHoliday.status} style={{ marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Holiday ID', shortId(viewHoliday)], ['Type', viewHoliday.type],
              ['Rule', ruleSummary(viewHoliday)], ['Paid Status', viewHoliday.paidStatus],
              ['Status', viewHoliday.status], ['Applicable To', applicableSummary(viewHoliday)],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {!viewHoliday.applicableAll && (viewHoliday.applicableEmployees || []).length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 6 }}>Applicable Employees</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {viewHoliday.applicableEmployees.map(id => (
                  <span key={id} className="badge badge-gray" style={{ fontSize: '0.75rem' }}>{employeeName(id)}</span>
                ))}
              </div>
            </div>
          )}
          {viewHoliday.description && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 6 }}>Description</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>{viewHoliday.description}</p>
            </div>
          )}
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {formOpen && (
        <Modal open={true} onClose={() => setFormOpen(false)} title={editHoliday ? 'Edit Holiday' : 'Add Holiday'} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editHoliday ? 'Save Changes' : 'Add Holiday'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Holiday Name <span className="required">*</span></label>
              <input className={`form-control ${formErrors.holidayName ? 'error' : ''}`} value={form.holidayName} onChange={e => setField('holidayName', e.target.value)} placeholder="e.g. Diwali, Weekly Off" />
              {formErrors.holidayName && <div className="form-error">{formErrors.holidayName}</div>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Holiday Type <span className="required">*</span></label>
                <select className={`form-control form-select ${formErrors.type ? 'error' : ''}`} value={form.type} onChange={e => setField('type', e.target.value)}>
                  <option value="">Select type</option>
                  {HOLIDAY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                {formErrors.type && <div className="form-error">{formErrors.type}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Paid Status</label>
                <select className="form-control form-select" value={form.paidStatus} onChange={e => setField('paidStatus', e.target.value)}>
                  {PAID_OPTIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Holiday_Rule inputs depend on type */}
            {needsDate(form.type) && (
              <div className="form-group">
                <label className="form-label">Date <span className="required">*</span></label>
                <input type="date" className={`form-control ${formErrors.date ? 'error' : ''}`} value={form.date} onChange={e => setField('date', e.target.value)} />
                {formErrors.date && <div className="form-error">{formErrors.date}</div>}
              </div>
            )}
            {form.type === 'Weekly' && (
              <div className="form-group">
                <label className="form-label">Day of Week <span className="required">*</span></label>
                <select className={`form-control form-select ${formErrors.dayOfWeek ? 'error' : ''}`} value={form.dayOfWeek} onChange={e => setField('dayOfWeek', e.target.value)}>
                  <option value="">Select day</option>
                  {DAYS_OF_WEEK.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                </select>
                {formErrors.dayOfWeek && <div className="form-error">{formErrors.dayOfWeek}</div>}
              </div>
            )}
            {form.type === 'Monthly' && (
              <div className="form-group">
                <label className="form-label">Day of Month <span className="required">*</span></label>
                <input type="number" min={1} max={31} className={`form-control ${formErrors.dayOfMonth ? 'error' : ''}`} value={form.dayOfMonth} onChange={e => setField('dayOfMonth', e.target.value)} placeholder="1-31" />
                {formErrors.dayOfMonth && <div className="form-error">{formErrors.dayOfMonth}</div>}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-control form-select" value={form.status} onChange={e => setField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {/* Applicable_Employees (Req 5.8, 14.1, 14.2) */}
            <div className="form-group">
              <label className="form-label">Applicable To</label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.875rem', marginBottom: 8 }}>
                <input type="checkbox" checked={form.applicableAll} onChange={e => setField('applicableAll', e.target.checked)} />
                Applies to all employees
              </label>
              {!form.applicableAll && (
                <>
                  <div style={{ maxHeight: 180, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8, padding: 8 }}>
                    {employees.length === 0 && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: 6 }}>No employees available</div>}
                    {employees.map(emp => {
                      const empId = emp.id || emp._id;
                      return (
                        <label key={emp._id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', padding: '4px 6px' }}>
                          <input
                            type="checkbox"
                            checked={form.applicableEmployees.includes(empId)}
                            onChange={() => toggleEmployee(empId)}
                          />
                          {emp.name}
                        </label>
                      );
                    })}
                  </div>
                  {formErrors.applicableEmployees && <div className="form-error">{formErrors.applicableEmployees}</div>}
                </>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={3} value={form.description} onChange={e => setField('description', e.target.value)} placeholder="Optional notes about this holiday..." />
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Holiday"
        message={`Are you sure you want to delete "${deleteTarget?.holidayName || 'this holiday'}"? This action cannot be undone.`}
        confirmLabel="Delete Holiday"
        loading={deleting}
      />
    </div>
  );
};

export default HolidayRecords;
