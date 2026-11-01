import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Eye, Plus, Pencil, Trash2,
  Printer, Download, AlertCircle, Wallet,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { advanceAPI } from '../../services/api';
import { filterRecords, toCsv } from '../../utils/recordFilters';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Pagination from '../../components/shared/Pagination';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Payment_Method options (Req 10.4).
const PAYMENT_METHOD_OPTIONS = ['Cash', 'UPI', 'Bank'];

// Advance_Status values (Req 10.6, 10.7). "Pending" is set on create; a status
// update control can move a record to "Settled/Returned" or "Salary Adjustment".
const STATUS_OPTIONS = ['Pending', 'Settled/Returned', 'Salary Adjustment'];

const recordId = (r) => (r?._id || r?.id || '').toString();
const shortId = (r) => recordId(r).slice(-8).toUpperCase();

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = {
  employee: '', date: today(), amount: '', paymentMethod: 'Cash', reason: '',
};

const AdvanceRecords = () => {
  const {
    advanceRecords, addAdvance, updateAdvance, deleteAdvance, employees, currency,
  } = useApp();
  const { user, isAdmin, can } = useAuth();
  const canAdd    = can('advances', 'add');
  const canEdit   = can('advances', 'edit');
  const canDelete = can('advances', 'delete');

  // ── Local list state (skeleton + retain last data on error) ────────────────
  const [records, setRecords] = useState(advanceRecords);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters / pagination ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [methodFilter, setMethodFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [viewRec, setViewRec] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editRec, setEditRec] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [statusModal, setStatusModal] = useState(null);
  const [statusValue, setStatusValue] = useState('');
  const [statusSaving, setStatusSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Oversight (view all records vs own) implied by edit rights; Admin passes.
  const canViewAll = canEdit || isAdmin();
  const sym = currency?.symbol || '';
  const fmtAmount = (n) => `${sym}${Number(n || 0).toLocaleString(currency?.locale || 'en-IN')}`;

  // ── Load advance records with loading + error handling (Req 10.1, 17.1, 17.3)
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await advanceAPI.getAll();
      if (data.success) {
        setRecords(data.data);
      } else {
        throw new Error(data.message || 'Failed to load advance records');
      }
    } catch (err) {
      // Retain the last successfully loaded records.
      setError(err.response?.data?.message || err.message || 'Failed to load advance records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep local list in sync with context mutations (add/update/delete).
  useEffect(() => { setRecords(advanceRecords); }, [advanceRecords]);

  // ── Employee scoping (Req 10.2): employees only see their own records ───────
  const scoped = useMemo(() => {
    if (canViewAll) return records;
    return records.filter(r =>
      (user?._id && (r.userId === user._id || r.userId?.toString?.() === user._id)) ||
      (user?.id && r.userId === user.id) ||
      (user?.email && r.email === user.email)
    );
  }, [records, canViewAll, user]);

  // ── Filtering (Req 12.1) via shared selector; type field = paymentMethod ────
  const filtered = useMemo(() => {
    const list = filterRecords(
      scoped,
      { search, status: statusFilter, type: methodFilter },
      { nameField: 'employeeName', statusField: 'status', typeField: 'paymentMethod' },
    );
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [scoped, search, statusFilter, methodFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Add / Edit ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditRec(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (rec) => {
    setEditRec(rec);
    setForm({
      employee: rec.employeeId || '',
      date: rec.date || today(),
      amount: rec.amount != null ? String(rec.amount) : '',
      paymentMethod: rec.paymentMethod || 'Cash',
      reason: rec.reason || '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErrors(e => ({ ...e, [k]: '' }));
  };

  const validateForm = () => {
    const errs = {};
    if (!form.employee) errs.employee = 'Select an employee';
    if (!form.date) errs.date = 'Select a date';
    const amt = parseFloat(form.amount);
    if (form.amount === '' || Number.isNaN(amt)) {
      errs.amount = 'Enter an amount';
    } else if (amt <= 0) {
      // Amount must be greater than zero (Req 10.5).
      errs.amount = 'Amount must be greater than zero';
    }
    if (!form.paymentMethod) errs.paymentMethod = 'Select a payment method';
    if (!form.reason) errs.reason = 'Provide a reason';
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
        // Store the selected employee's employeeId on the record (Req 14.2).
        employeeId: selectedEmp?.id || form.employee,
        employeeName: selectedEmp?.name || form.employee,
        date: form.date,
        amount: parseFloat(form.amount),
        paymentMethod: form.paymentMethod,
        reason: form.reason,
      };

      if (editRec) {
        await updateAdvance(recordId(editRec), payload);
        toast.success('Advance record updated');
      } else {
        await addAdvance(payload);
        toast.success('Advance given successfully');
      }
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err) {
      // Retain the user's entered values on backend error (Req 17.2).
      toast.error(err.response?.data?.message || err.message || 'Failed to save advance record');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Status update control (Req 10.7) ────────────────────────────────────────
  const openStatus = (rec) => {
    setStatusModal(rec);
    setStatusValue(rec.status || 'Pending');
  };

  const handleStatusSave = async () => {
    setStatusSaving(true);
    try {
      await updateAdvance(recordId(statusModal), { status: statusValue });
      toast.success(`Status updated to ${statusValue}`);
      setStatusModal(null);
      setViewRec(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to update status');
    } finally {
      setStatusSaving(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteAdvance(recordId(deleteTarget));
      toast.success('Advance record deleted');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete advance record');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export (Req 12.2) — exports the currently filtered records ──────────────
  const handleExport = () => {
    const csv = toCsv(filtered, [
      { key: '_id', label: 'ID', accessor: shortId },
      { key: 'employeeName', label: 'Employee' },
      { key: 'employeeId', label: 'Employee ID' },
      { key: 'date', label: 'Date' },
      { key: 'amount', label: 'Amount' },
      { key: 'paymentMethod', label: 'Payment Method' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `advance-records-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <td>${sym}${Number(r.amount || 0).toLocaleString()}</td>
        <td>${r.paymentMethod || ''}</td>
        <td>${r.status || ''}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Unable to open print window'); return; }
    win.document.write(`
      <html>
        <head>
          <title>Advance Records</title>
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
          <h1>Advance Records</h1>
          <p>${filtered.length} record(s) · Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>ID</th><th>Employee</th><th>Date</th><th>Amount</th><th>Method</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function () { window.print(); }</script>
        </body>
      </html>`);
    win.document.close();
  };

  const pendingCount = scoped.filter(r => r.status === 'Pending').length;
  const totalAmount = scoped.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  if (loading) return <SkeletonLoader />;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Advances</span><span className="breadcrumb-sep">/</span><span>Advance Records</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Advance Records</h1>
            <p className="page-subtitle">{pendingCount} pending advance{pendingCount === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handlePrint} title="Print filtered records"><Printer size={14} /> Print</button>
            <button className="btn btn-outline" onClick={handleExport} title="Export filtered records"><Download size={14} /> Export</button>
            {canAdd && <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Give Advance</button>}
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
          { label: 'Total Advances', value: scoped.length, color: 'var(--primary)' },
          { label: 'Pending', value: pendingCount, color: 'var(--warning)' },
          { label: 'Total Amount', value: fmtAmount(totalAmount), color: 'var(--success)' },
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
            <input className="form-control" placeholder="Search by employee or ID..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 170 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select className="form-control form-select" style={{ width: 150 }} value={methodFilter} onChange={e => { setMethodFilter(e.target.value); setPage(1); }}>
            <option value="">All Methods</option>
            {PAYMENT_METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Date</th><th>Amount</th>
              <th>Method</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(rec => (
              <tr key={recordId(rec)}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shortId(rec)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={rec.employeeName} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{rec.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{rec.employeeId}</div>
                    </div>
                  </div>
                </td>
                <td style={{ fontSize: '0.875rem' }}>{rec.date}</td>
                <td><span style={{ fontWeight: 600 }}>{fmtAmount(rec.amount)}</span></td>
                <td><span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{rec.paymentMethod}</span></td>
                <td><Badge status={rec.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon primary" onClick={() => setViewRec(rec)} title="View Details"><Eye size={13} /></button>
                    {canEdit && (
                      <>
                        <button className="btn-icon" onClick={() => openEdit(rec)} title="Edit"><Pencil size={13} /></button>
                        <button className="btn-icon" style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }} onClick={() => openStatus(rec)} title="Update Status"><Wallet size={13} /></button>
                      </>
                    )}
                    {canDelete && (
                      <button className="btn-icon danger" onClick={() => setDeleteTarget(rec)} title="Delete"><Trash2 size={13} /></button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No advance records found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* View Modal */}
      {viewRec && (
        <Modal open={true} onClose={() => setViewRec(null)} title="Advance Record Details" size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setViewRec(null)}>Close</button>
              {canEdit && (
                <button className="btn btn-primary" onClick={() => { openStatus(viewRec); }}>Update Status</button>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
            <Avatar name={viewRec.employeeName} size="lg" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewRec.employeeName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{viewRec.employeeId}</div>
              <Badge status={viewRec.status} style={{ marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Record ID', shortId(viewRec)], ['Date', viewRec.date],
              ['Amount', fmtAmount(viewRec.amount)], ['Payment Method', viewRec.paymentMethod],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {viewRec.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 6 }}>Reason</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>{viewRec.reason}</p>
            </div>
          )}
        </Modal>
      )}

      {/* Add / Edit (Give Advance) Modal */}
      {formOpen && (
        <Modal open={true} onClose={() => setFormOpen(false)} title={editRec ? 'Edit Advance Record' : 'Give Advance'} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editRec ? 'Save Changes' : 'Give Advance'}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Date <span className="required">*</span></label>
                <input type="date" className={`form-control ${formErrors.date ? 'error' : ''}`} value={form.date} onChange={e => setField('date', e.target.value)} />
                {formErrors.date && <div className="form-error">{formErrors.date}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">Amount <span className="required">*</span></label>
                <input type="number" min="0.01" step="0.01" className={`form-control ${formErrors.amount ? 'error' : ''}`} value={form.amount} onChange={e => setField('amount', e.target.value)} placeholder="0.00" />
                {formErrors.amount && <div className="form-error">{formErrors.amount}</div>}
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Payment Method <span className="required">*</span></label>
              <select className={`form-control form-select ${formErrors.paymentMethod ? 'error' : ''}`} value={form.paymentMethod} onChange={e => setField('paymentMethod', e.target.value)}>
                {PAYMENT_METHOD_OPTIONS.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              {formErrors.paymentMethod && <div className="form-error">{formErrors.paymentMethod}</div>}
            </div>
            <div className="form-group">
              <label className="form-label">Reason <span className="required">*</span></label>
              <textarea className={`form-control ${formErrors.reason ? 'error' : ''}`} rows={3} value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Describe the reason for the advance..." />
              {formErrors.reason && <div className="form-error">{formErrors.reason}</div>}
            </div>
          </form>
        </Modal>
      )}

      {/* Status Update Modal (Req 10.7) */}
      {statusModal && (
        <Modal open={true} onClose={() => setStatusModal(null)} title="Update Advance Status" size="sm"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setStatusModal(null)} disabled={statusSaving}>Cancel</button>
              <button className="btn btn-primary" onClick={handleStatusSave} disabled={statusSaving}>{statusSaving ? 'Saving...' : 'Save Status'}</button>
            </>
          }
        >
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Updating advance status for <strong>{statusModal?.employeeName}</strong> ({fmtAmount(statusModal?.amount)})</p>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select className="form-control form-select" value={statusValue} onChange={e => setStatusValue(e.target.value)}>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Advance Record"
        message={`Are you sure you want to delete the advance record for ${deleteTarget?.employeeName || 'this employee'}? This action cannot be undone.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </div>
  );
};

export default AdvanceRecords;
