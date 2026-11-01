import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Eye, Plus, Pencil, Trash2,
  Printer, Download, AlertCircle, Clock, CheckCircle,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { overtimeAPI } from '../../services/api';
import { filterRecords, toCsv } from '../../utils/recordFilters';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Pagination from '../../components/shared/Pagination';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const recordId = (r) => (r?._id || r?.id || '').toString();
const shortId = (r) => recordId(r).slice(-8).toUpperCase();

const emptyForm = {
  employee: '',
  date: new Date().toISOString().slice(0, 10),
  durationHours: '',
  durationMinutes: '',
  ratePerHour: '',
  reason: '',
};

// Live preview of the server-computed amount: (hours + minutes/60) * ratePerHour.
const computeAmount = (hours, minutes, rate) => {
  const h = Number(hours) || 0;
  const m = Number(minutes) || 0;
  const r = Number(rate) || 0;
  return (h + m / 60) * r;
};

const OvertimeRecords = () => {
  const {
    overtimeEntries, addOvertime, updateOvertime, settleOvertime, deleteOvertime,
    employees, currency,
  } = useApp();
  const { user, isAdmin, can } = useAuth();
  const canAdd    = can('overtime', 'add');
  const canEdit   = can('overtime', 'edit');
  const canDelete = can('overtime', 'delete');
  const canSettle = can('overtime', 'manage');

  const fmtMoney = (n) =>
    `${currency?.symbol || ''}${Number(n || 0).toLocaleString(currency?.locale || 'en-IN', { maximumFractionDigits: 2 })}`;

  // ── Local list state (skeleton + retain last data on error) ─────────────────
  const [records, setRecords] = useState(overtimeEntries);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters / pagination ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [viewEntry, setViewEntry] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editEntry, setEditEntry] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [settleTarget, setSettleTarget] = useState(null);
  const [settling, setSettling] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Can this user see every record (vs only their own)? Managing/editing implies
  // oversight; Admin always passes via can(). Falls back to legacy role check.
  const canViewAll = canEdit || canSettle || isAdmin();

  // ── Load overtime records with loading + error handling (Req 8.1, 17.1, 17.3)
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await overtimeAPI.getAll();
      if (data.success) {
        setRecords(data.data);
      } else {
        throw new Error(data.message || 'Failed to load overtime records');
      }
    } catch (err) {
      // Retain the last successfully loaded records.
      setError(err.response?.data?.message || err.message || 'Failed to load overtime records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep local list in sync with context mutations (add/update/settle/delete).
  useEffect(() => { setRecords(overtimeEntries); }, [overtimeEntries]);

  // ── Employee scoping (Req 8.2): employees only see their own entries ────────
  const scoped = useMemo(() => {
    if (canViewAll) return records;
    return records.filter(r =>
      (user?._id && (r.userId === user._id || r.userId?.toString?.() === user._id)) ||
      (user?.id && r.userId === user.id) ||
      (user?.email && r.email === user.email)
    );
  }, [records, canViewAll, user]);

  // ── Filtering (Req 12.1) via shared selector; status field = status ─────────
  const filtered = useMemo(() => {
    const list = filterRecords(
      scoped,
      { search, status: statusFilter },
      { nameField: 'employeeName', statusField: 'status', typeField: 'status' },
    );
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [scoped, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Add / Edit ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditEntry(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (entry) => {
    setEditEntry(entry);
    setForm({
      employee: entry.employeeId || '',
      date: entry.date || '',
      durationHours: entry.durationHours ?? '',
      durationMinutes: entry.durationMinutes ?? '',
      ratePerHour: entry.ratePerHour ?? '',
      reason: entry.reason || '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErrors(e => ({ ...e, [k]: '' }));
  };

  const previewAmount = useMemo(
    () => computeAmount(form.durationHours, form.durationMinutes, form.ratePerHour),
    [form.durationHours, form.durationMinutes, form.ratePerHour],
  );

  // Client-side guard mirroring the backend predicate (Req 8.5): at least one of
  // hours/minutes > 0 and a non-negative ratePerHour.
  const validateForm = () => {
    const errs = {};
    if (!form.employee) errs.employee = 'Select an employee';
    if (!form.date) errs.date = 'Select a date';

    const hours = Number(form.durationHours) || 0;
    const minutes = Number(form.durationMinutes) || 0;
    const rate = form.ratePerHour === '' ? NaN : Number(form.ratePerHour);

    if (hours < 0) errs.durationHours = 'Hours cannot be negative';
    if (minutes < 0) errs.durationMinutes = 'Minutes cannot be negative';
    if (hours <= 0 && minutes <= 0) {
      errs.durationHours = 'Enter a duration greater than zero';
    }
    if (Number.isNaN(rate)) {
      errs.ratePerHour = 'Enter a rate per hour';
    } else if (rate < 0) {
      errs.ratePerHour = 'Rate cannot be negative';
    }
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateForm();
    if (Object.keys(errs).length > 0) { setFormErrors(errs); return; }

    const selectedEmp = employees.find(emp => emp.id === form.employee || emp._id === form.employee);
    setSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmp?.id || form.employee,
        employeeName: selectedEmp?.name || form.employee,
        email: selectedEmp?.email || '',
        date: form.date,
        durationHours: Number(form.durationHours) || 0,
        durationMinutes: Number(form.durationMinutes) || 0,
        ratePerHour: Number(form.ratePerHour) || 0,
        reason: form.reason,
      };

      if (editEntry) {
        await updateOvertime(recordId(editEntry), payload);
        toast.success('Overtime entry updated');
      } else {
        await addOvertime(payload);
        toast.success('Overtime logged successfully');
      }
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err) {
      // Retain the user's entered values on failure (Req 17.2).
      toast.error(err.response?.data?.message || err.message || 'Failed to save overtime entry');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Settle (Req 8.7) — set status to "Paid" ─────────────────────────────────
  const handleSettle = async () => {
    setSettling(true);
    try {
      await settleOvertime(recordId(settleTarget));
      toast.success(`Overtime marked as Paid for ${settleTarget.employeeName || 'employee'}`);
      setSettleTarget(null);
      setViewEntry(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to settle overtime');
    } finally {
      setSettling(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteOvertime(recordId(deleteTarget));
      toast.success('Overtime entry deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete overtime entry');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export (Req 12.2) — exports the currently filtered records ──────────────
  const handleExport = () => {
    const csv = toCsv(filtered, [
      { key: '_id', label: 'ID', accessor: shortId },
      { key: 'employeeName', label: 'Employee' },
      { key: 'date', label: 'Date' },
      { key: 'durationHours', label: 'Hours' },
      { key: 'durationMinutes', label: 'Minutes' },
      { key: 'ratePerHour', label: 'Rate/Hour' },
      { key: 'totalAmount', label: 'Total Amount' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime-records-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filtered.length} record${filtered.length === 1 ? '' : 's'}`);
  };

  // ── Print (Req 12.3) — printable rendering of the currently filtered records ─
  const handlePrint = () => {
    const rows = filtered.map(r => `
      <tr>
        <td>${shortId(r)}</td>
        <td>${r.employeeName || ''}</td>
        <td>${r.date || ''}</td>
        <td>${r.durationHours ?? 0}h ${r.durationMinutes ?? 0}m</td>
        <td>${r.ratePerHour ?? ''}</td>
        <td>${r.totalAmount ?? ''}</td>
        <td>${r.status || ''}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Unable to open print window'); return; }
    win.document.write(`
      <html>
        <head>
          <title>Overtime Records</title>
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
          <h1>Overtime Records</h1>
          <p>${filtered.length} record(s) · Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>ID</th><th>Employee</th><th>Date</th><th>Duration</th><th>Rate/Hour</th><th>Total Amount</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function () { window.print(); }</script>
        </body>
      </html>`);
    win.document.close();
  };

  const pendingCount = scoped.filter(r => r.status === 'Pending').length;
  const paidCount = scoped.filter(r => r.status === 'Paid').length;
  const pendingAmount = scoped
    .filter(r => r.status === 'Pending')
    .reduce((sum, r) => sum + (Number(r.totalAmount) || 0), 0);

  if (loading) return <SkeletonLoader />;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Overtime</span><span className="breadcrumb-sep">/</span><span>Overtime Records</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Overtime Records</h1>
            <p className="page-subtitle">{pendingCount} pending entr{pendingCount === 1 ? 'y' : 'ies'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handlePrint} title="Print filtered records"><Printer size={14} /> Print</button>
            <button className="btn btn-outline" onClick={handleExport} title="Export filtered records"><Download size={14} /> Export</button>
            {canAdd && <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Log Overtime</button>}
          </div>
        </div>
      </div>

      {/* Error banner — shown alongside the retained last-loaded data (Req 17.3) */}
      {error && (
        <div className="card" style={{ marginBottom: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: '3px solid var(--danger)' }}>
          <AlertCircle size={16} color="var(--danger)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--danger)', flex: 1 }}>{error}</span>
          <button className="btn btn-outline btn-sm" onClick={load}>Retry</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Entries', value: scoped.length, color: 'var(--primary)' },
          { label: 'Pending', value: pendingCount, color: 'var(--warning)' },
          { label: 'Paid', value: paidCount, color: 'var(--success)' },
          { label: 'Pending Amount', value: fmtMoney(pendingAmount), color: 'var(--primary)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input className="form-control" placeholder="Search by employee or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="Pending">Pending</option>
            <option value="Paid">Paid</option>
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Date</th><th>Duration</th>
              <th>Rate/Hour</th><th>Total Amount</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(entry => (
              <tr key={recordId(entry)}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shortId(entry)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={entry.employeeName} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{entry.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{entry.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{entry.date}</td>
                <td style={{ fontSize: '0.875rem' }}>{entry.durationHours ?? 0}h {entry.durationMinutes ?? 0}m</td>
                <td style={{ fontSize: '0.875rem' }}>{fmtMoney(entry.ratePerHour)}</td>
                <td><span style={{ fontWeight: 600 }}>{fmtMoney(entry.totalAmount)}</span></td>
                <td><Badge status={entry.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon primary" onClick={() => setViewEntry(entry)} title="View Details"><Eye size={13} /></button>
                    {entry.status === 'Pending' && canEdit && (
                      <button className="btn-icon" onClick={() => openEdit(entry)} title="Edit"><Pencil size={13} /></button>
                    )}
                    {entry.status === 'Pending' && canSettle && (
                      <button className="btn-icon" style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }} onClick={() => setSettleTarget(entry)} title="Settle (mark Paid)">
                        <CheckCircle size={13} />
                      </button>
                    )}
                    {canDelete && (
                      <button className="btn-icon danger" onClick={() => setDeleteTarget(entry)} title="Delete"><Trash2 size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No overtime records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* View Modal */}
      {viewEntry && (
        <Modal open={true} onClose={() => setViewEntry(null)} title="Overtime Entry Details" size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setViewEntry(null)}>Close</button>
              {viewEntry.status === 'Pending' && canSettle && (
                <button className="btn btn-success" onClick={() => { setSettleTarget(viewEntry); }}>Mark as Paid</button>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
            <Avatar name={viewEntry.employeeName} size="lg" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewEntry.employeeName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{viewEntry.employeeId}</div>
              <Badge status={viewEntry.status} style={{ marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Entry ID', shortId(viewEntry)], ['Date', viewEntry.date],
              ['Duration', `${viewEntry.durationHours ?? 0}h ${viewEntry.durationMinutes ?? 0}m`],
              ['Rate / Hour', fmtMoney(viewEntry.ratePerHour)],
              ['Total Amount', fmtMoney(viewEntry.totalAmount)], ['Status', viewEntry.status],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {viewEntry.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 6 }}>Reason</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>{viewEntry.reason}</p>
            </div>
          )}
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {formOpen && (
        <Modal open={true} onClose={() => setFormOpen(false)} title={editEntry ? 'Edit Overtime Entry' : 'Log Overtime'} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editEntry ? 'Save Changes' : 'Log Overtime'}
              </button>
            </>
          }
        >
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Employee <span className="required">*</span></label>
              <select className={`form-control form-select ${formErrors.employee ? 'error' : ''}`} value={form.employee} onChange={e => setField('employee', e.target.value)}>
                <option value="">Select employee</option>
                {employees.map(emp => <option key={emp._id} value={emp.id}>{emp.name}</option>)}
              </select>
              {formErrors.employee && <div className="form-error">{formErrors.employee}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" className={`form-control ${formErrors.date ? 'error' : ''}`} value={form.date} onChange={e => setField('date', e.target.value)} />
              {formErrors.date && <div className="form-error">{formErrors.date}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Duration (Hours) <span className="required">*</span></label>
                <input type="number" min="0" className={`form-control ${formErrors.durationHours ? 'error' : ''}`} value={form.durationHours} onChange={e => setField('durationHours', e.target.value)} placeholder="0" />
                {formErrors.durationHours && <div className="form-error">{formErrors.durationHours}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Duration (Minutes)</label>
                <input type="number" min="0" max="59" className={`form-control ${formErrors.durationMinutes ? 'error' : ''}`} value={form.durationMinutes} onChange={e => setField('durationMinutes', e.target.value)} placeholder="0" />
                {formErrors.durationMinutes && <div className="form-error">{formErrors.durationMinutes}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Rate per Hour <span className="required">*</span></label>
              <input type="number" min="0" step="0.01" className={`form-control ${formErrors.ratePerHour ? 'error' : ''}`} value={form.ratePerHour} onChange={e => setField('ratePerHour', e.target.value)} placeholder="0.00" />
              {formErrors.ratePerHour && <div className="form-error">{formErrors.ratePerHour}</div>}
            </div>
            {previewAmount > 0 && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>Estimated Amount: <strong>{fmtMoney(previewAmount)}</strong></span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Reason</label>
              <textarea className={`form-control ${formErrors.reason ? 'error' : ''}`} rows={3} value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Describe the reason for the overtime..." />
              {formErrors.reason && <div className="form-error">{formErrors.reason}</div>}
            </div>
          </form>
        </Modal>
      )}

      {/* Settle Confirmation (Req 8.7) */}
      <ConfirmModal
        open={!!settleTarget}
        onClose={() => setSettleTarget(null)}
        onConfirm={handleSettle}
        title="Settle Overtime"
        message={`Mark the overtime entry for ${settleTarget?.employeeName || 'this employee'} as Paid? This confirms the overtime has been compensated.`}
        confirmLabel="Mark as Paid"
        confirmVariant="btn-success"
        loading={settling}
      />

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Overtime Entry"
        message={`Are you sure you want to delete the overtime entry for ${deleteTarget?.employeeName || 'this employee'}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
};

export default OvertimeRecords;
