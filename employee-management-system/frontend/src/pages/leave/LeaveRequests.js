import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Search, Eye, CheckCircle, XCircle, Plus, Pencil, Trash2,
  Printer, Download, AlertCircle, Calendar,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { leaveAPI } from '../../services/api';
import { filterRecords, toCsv } from '../../utils/recordFilters';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Pagination from '../../components/shared/Pagination';
import SkeletonLoader from '../../components/shared/SkeletonLoader';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// Screenshot leave-type labels. "Earned" is stored as "Annual Leave" (Req 2.3 / 18.1).
const LEAVE_TYPE_OPTIONS = [
  { label: 'Casual', value: 'Casual Leave' },
  { label: 'Sick', value: 'Sick Leave' },
  { label: 'Earned', value: 'Annual Leave' },
  { label: 'Unpaid', value: 'Unpaid Leave' },
  { label: 'Maternity', value: 'Maternity Leave' },
  { label: 'Paternity', value: 'Paternity Leave' },
];

const recordId = (r) => (r?._id || r?.id || '').toString();
const shortId = (r) => recordId(r).slice(-8).toUpperCase();

const emptyForm = {
  employee: '', leaveType: '', startDate: '', endDate: '', reason: '',
};

const LeaveRequests = () => {
  const { leaveRequests, addLeaveRequest, updateLeaveStatus, cancelLeave, employees } = useApp();
  const { user, isAdmin } = useAuth();

  // ── Local list state (so we can show skeleton + retain last data on error) ──
  const [records, setRecords] = useState(leaveRequests);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Filters / pagination ──
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);

  // ── Modals ──
  const [viewReq, setViewReq] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editReq, setEditReq] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const canManage = isAdmin();

  // ── Load leave records with loading + error handling (Req 1.1, 1.7, 1.8) ────
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await leaveAPI.getAll();
      if (data.success) {
        setRecords(data.data);
      } else {
        throw new Error(data.message || 'Failed to load leave records');
      }
    } catch (err) {
      // Retain the last successfully loaded records (Req 1.8).
      setError(err.response?.data?.message || err.message || 'Failed to load leave records');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Keep local list in sync with context mutations (add/approve/reject/cancel).
  useEffect(() => { setRecords(leaveRequests); }, [leaveRequests]);

  // ── Employee scoping (Req 1.2): employees only see their own records ────────
  const scoped = useMemo(() => {
    if (canManage) return records;
    return records.filter(r =>
      (user?._id && (r.userId === user._id || r.userId?.toString?.() === user._id)) ||
      (user?.id && r.userId === user.id) ||
      (user?.email && r.email === user.email)
    );
  }, [records, canManage, user]);

  // ── Filtering (Req 1.3, 1.4, 1.5) via shared selector; type field = leaveType
  const filtered = useMemo(() => {
    const list = filterRecords(
      scoped,
      { search, status: statusFilter, type: typeFilter },
      { nameField: 'employeeName', statusField: 'status', typeField: 'leaveType' },
    );
    return [...list].sort((a, b) => (b.appliedDate || '').localeCompare(a.appliedDate || ''));
  }, [scoped, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const leaveTypes = useMemo(
    () => [...new Set(scoped.map(r => r.leaveType).filter(Boolean))],
    [scoped],
  );

  // ── Approve / reject ────────────────────────────────────────────────────────
  const handleApprove = async (id, name) => {
    try {
      await updateLeaveStatus(id, 'approved');
      toast.success(`Leave approved for ${name}`);
      setViewReq(null);
    } catch (err) {
      toast.error(err.message || 'Failed to approve leave');
    }
  };

  const handleReject = async () => {
    try {
      await updateLeaveStatus(recordId(rejectModal), 'rejected', rejectReason);
      toast.success(`Leave rejected for ${rejectModal.employeeName}`);
      setRejectModal(null);
      setRejectReason('');
      setViewReq(null);
    } catch (err) {
      toast.error(err.message || 'Failed to reject leave');
    }
  };

  // ── Add / Edit ──────────────────────────────────────────────────────────────
  const openAdd = () => {
    setEditReq(null);
    setForm(emptyForm);
    setFormErrors({});
    setFormOpen(true);
  };

  const openEdit = (req) => {
    setEditReq(req);
    setForm({
      employee: req.employeeId || '',
      leaveType: req.leaveType || '',
      startDate: req.startDate || '',
      endDate: req.endDate || '',
      reason: req.reason || '',
    });
    setFormErrors({});
    setFormOpen(true);
  };

  const setField = (k, v) => {
    setForm(f => ({ ...f, [k]: v }));
    setFormErrors(e => ({ ...e, [k]: '' }));
  };

  const formDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0;
    const d = Math.ceil((new Date(form.endDate) - new Date(form.startDate)) / 86400000) + 1;
    return d > 0 ? d : 0;
  }, [form.startDate, form.endDate]);

  const validateForm = () => {
    const errs = {};
    if (!form.employee) errs.employee = 'Select an employee';
    if (!form.leaveType) errs.leaveType = 'Select leave type';
    if (!form.startDate) errs.startDate = 'Select start date';
    if (!form.endDate) errs.endDate = 'Select end date';
    if (!form.reason) errs.reason = 'Provide a reason';
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      errs.endDate = 'End date cannot be before start date';
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
        department: selectedEmp?.department || '',
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        days: formDays,
        reason: form.reason,
      };

      if (editReq) {
        // The leave backend exposes no content-edit endpoint; an edit to a
        // still-pending request is performed as cancel-then-resubmit so the
        // existing endpoints and enum remain unchanged.
        await cancelLeave(recordId(editReq));
        await addLeaveRequest(payload);
        toast.success('Leave request updated');
      } else {
        await addLeaveRequest(payload);
        toast.success('Leave request submitted successfully');
      }
      setFormOpen(false);
      setForm(emptyForm);
    } catch (err) {
      // Retain the user's entered values on failure (Req 17.2).
      toast.error(err.response?.data?.message || err.message || 'Failed to save leave request');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete (cancel) ─────────────────────────────────────────────────────────
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await cancelLeave(recordId(deleteTarget));
      toast.success('Leave request cancelled');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.message || 'Failed to cancel leave request');
    } finally {
      setDeleting(false);
    }
  };

  // ── Export (Req 12.2) — exports the currently filtered records ──────────────
  const handleExport = () => {
    const csv = toCsv(filtered, [
      { key: '_id', label: 'ID', accessor: shortId },
      { key: 'employeeName', label: 'Employee' },
      { key: 'department', label: 'Department' },
      { key: 'leaveType', label: 'Leave Type' },
      { key: 'startDate', label: 'From' },
      { key: 'endDate', label: 'To' },
      { key: 'days', label: 'Days' },
      { key: 'appliedDate', label: 'Applied' },
      { key: 'status', label: 'Status' },
      { key: 'reason', label: 'Reason' },
    ]);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leave-requests-${new Date().toISOString().slice(0, 10)}.csv`;
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
        <td>${r.leaveType || ''}</td>
        <td>${r.startDate || ''}</td>
        <td>${r.endDate || ''}</td>
        <td>${r.days ?? ''}</td>
        <td>${r.appliedDate || ''}</td>
        <td>${r.status || ''}</td>
      </tr>`).join('');
    const win = window.open('', '_blank');
    if (!win) { toast.error('Unable to open print window'); return; }
    win.document.write(`
      <html>
        <head>
          <title>Leave Requests</title>
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
          <h1>Leave Requests</h1>
          <p>${filtered.length} record(s) · Generated ${new Date().toLocaleString()}</p>
          <table>
            <thead>
              <tr><th>ID</th><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th><th>Days</th><th>Applied</th><th>Status</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.onload = function () { window.print(); }</script>
        </body>
      </html>`);
    win.document.close();
  };

  const pendingCount = scoped.filter(r => r.status === 'pending').length;

  if (loading) return <SkeletonLoader />;

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Leave Requests</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Leave Requests</h1>
            <p className="page-subtitle">{pendingCount} pending request{pendingCount === 1 ? '' : 's'}</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline" onClick={handlePrint} title="Print filtered records"><Printer size={14} /> Print</button>
            <button className="btn btn-outline" onClick={handleExport} title="Export filtered records"><Download size={14} /> Export</button>
            <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Leave</button>
          </div>
        </div>
      </div>

      {/* Error banner — shown alongside the retained last-loaded data (Req 1.8) */}
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
          { label: 'Total Requests', value: scoped.length, color: 'var(--primary)' },
          { label: 'Pending', value: pendingCount, color: 'var(--warning)' },
          { label: 'Approved', value: scoped.filter(r => r.status === 'approved').length, color: 'var(--success)' },
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
          <select className="form-control form-select" style={{ width: 140 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <select className="form-control form-select" style={{ width: 160 }} value={typeFilter} onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {leaveTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th><th>Employee</th><th>Leave Type</th><th>From</th><th>To</th>
              <th>Days</th><th>Applied</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(req => (
              <tr key={recordId(req)}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{shortId(req)}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={req.employeeName} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{req.employeeName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{req.department}</div>
                    </div>
                  </div>
                </td>
                <td><span className="badge badge-info" style={{ fontSize: '0.75rem' }}>{req.leaveType}</span></td>
                <td style={{ fontSize: '0.875rem' }}>{req.startDate}</td>
                <td style={{ fontSize: '0.875rem' }}>{req.endDate}</td>
                <td><span style={{ fontWeight: 600 }}>{req.days}</span></td>
                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.appliedDate}</td>
                <td><Badge status={req.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon primary" onClick={() => setViewReq(req)} title="View Details"><Eye size={13} /></button>
                    {req.status === 'pending' && (
                      <>
                        <button className="btn-icon" onClick={() => openEdit(req)} title="Edit"><Pencil size={13} /></button>
                        {canManage && (
                          <>
                            <button className="btn-icon" style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }} onClick={() => handleApprove(recordId(req), req.employeeName)} title="Approve">
                              <CheckCircle size={13} />
                            </button>
                            <button className="btn-icon danger" onClick={() => setRejectModal(req)} title="Reject"><XCircle size={13} /></button>
                          </>
                        )}
                        <button className="btn-icon danger" onClick={() => setDeleteTarget(req)} title="Delete"><Trash2 size={13} /></button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No leave requests found</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />

      {/* View Modal */}
      {viewReq && (
        <Modal open={true} onClose={() => setViewReq(null)} title="Leave Request Details" size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setViewReq(null)}>Close</button>
              {viewReq.status === 'pending' && canManage && (
                <>
                  <button className="btn btn-danger" onClick={() => { setRejectModal(viewReq); setViewReq(null); }}>Reject</button>
                  <button className="btn btn-success" onClick={() => handleApprove(recordId(viewReq), viewReq.employeeName)}>Approve</button>
                </>
              )}
            </>
          }
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '16px', background: 'var(--bg)', borderRadius: 10 }}>
            <Avatar name={viewReq.employeeName} size="lg" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewReq.employeeName}</div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{viewReq.department}</div>
              <Badge status={viewReq.status} style={{ marginTop: 4 }} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              ['Request ID', shortId(viewReq)], ['Leave Type', viewReq.leaveType],
              ['Start Date', viewReq.startDate], ['End Date', viewReq.endDate],
              ['Number of Days', viewReq.days], ['Applied Date', viewReq.appliedDate],
            ].map(([k, v]) => (
              <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>{k}</div>
                <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</div>
              </div>
            ))}
          </div>
          {viewReq.reason && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, marginBottom: 6 }}>Reason</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: 12 }}>{viewReq.reason}</p>
            </div>
          )}
        </Modal>
      )}

      {/* Add / Edit Modal */}
      {formOpen && (
        <Modal open={true} onClose={() => setFormOpen(false)} title={editReq ? 'Edit Leave Request' : 'Add Leave Request'} size="md"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setFormOpen(false)} disabled={submitting}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Saving...' : editReq ? 'Save Changes' : 'Submit Request'}
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
              <label className="form-label">Leave Type <span className="required">*</span></label>
              <select className={`form-control form-select ${formErrors.leaveType ? 'error' : ''}`} value={form.leaveType} onChange={e => setField('leaveType', e.target.value)}>
                <option value="">Select leave type</option>
                {LEAVE_TYPE_OPTIONS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              {formErrors.leaveType && <div className="form-error">{formErrors.leaveType}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
              <div className="form-group">
                <label className="form-label">Start Date <span className="required">*</span></label>
                <input type="date" className={`form-control ${formErrors.startDate ? 'error' : ''}`} value={form.startDate} onChange={e => setField('startDate', e.target.value)} />
                {formErrors.startDate && <div className="form-error">{formErrors.startDate}</div>}
              </div>
              <div className="form-group">
                <label className="form-label">End Date <span className="required">*</span></label>
                <input type="date" className={`form-control ${formErrors.endDate ? 'error' : ''}`} value={form.endDate} onChange={e => setField('endDate', e.target.value)} min={form.startDate} />
                {formErrors.endDate && <div className="form-error">{formErrors.endDate}</div>}
              </div>
            </div>
            {formDays > 0 && (
              <div style={{ background: 'var(--primary-light)', borderRadius: 10, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={15} color="var(--primary)" />
                <span style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 500 }}>Duration: <strong>{formDays} day{formDays > 1 ? 's' : ''}</strong></span>
              </div>
            )}
            <div className="form-group">
              <label className="form-label">Reason <span className="required">*</span></label>
              <textarea className={`form-control ${formErrors.reason ? 'error' : ''}`} rows={3} value={form.reason} onChange={e => setField('reason', e.target.value)} placeholder="Describe the reason for the leave request..." />
              {formErrors.reason && <div className="form-error">{formErrors.reason}</div>}
            </div>
          </form>
        </Modal>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal open={true} onClose={() => setRejectModal(null)} title="Reject Leave Request" size="sm"
          footer={<><button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button><button className="btn btn-danger" onClick={handleReject}>Reject Leave</button></>}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>Rejecting leave request for <strong>{rejectModal?.employeeName}</strong></p>
          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <textarea className="form-control" rows={3} placeholder="Provide a reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          </div>
        </Modal>
      )}

      {/* Delete / Cancel Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Cancel Leave Request"
        message={`Are you sure you want to cancel the leave request for ${deleteTarget?.employeeName || 'this employee'}? This action cannot be undone.`}
        confirmLabel="Cancel Request"
        loading={deleting}
      />
    </div>
  );
};

export default LeaveRequests;
