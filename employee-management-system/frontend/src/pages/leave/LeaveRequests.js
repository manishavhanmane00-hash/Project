import React, { useState, useMemo } from 'react';
import { Search, Eye, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import Pagination from '../../components/shared/Pagination';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const LeaveRequests = () => {
  const { leaveRequests, updateLeaveStatus } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [viewReq, setViewReq] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const filtered = useMemo(() => {
    let list = [...leaveRequests];
    if (search) { const s = search.toLowerCase(); list = list.filter(r => r.employeeName.toLowerCase().includes(s) || r.id.toLowerCase().includes(s)); }
    if (statusFilter) list = list.filter(r => r.status === statusFilter);
    if (typeFilter) list = list.filter(r => r.leaveType === typeFilter);
    return list.sort((a, b) => b.appliedDate.localeCompare(a.appliedDate));
  }, [leaveRequests, search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleApprove = (id, name) => {
    updateLeaveStatus(id, 'approved');
    toast.success(`Leave approved for ${name}`);
    setViewReq(null);
  };

  const handleReject = () => {
    updateLeaveStatus(rejectModal.id, 'rejected', rejectReason);
    toast.error(`Leave rejected for ${rejectModal.employeeName}`);
    setRejectModal(null);
    setRejectReason('');
    setViewReq(null);
  };

  const leaveTypes = [...new Set(leaveRequests.map(r => r.leaveType))];

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Leave Requests</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Leave Requests</h1>
            <p className="page-subtitle">{leaveRequests.filter(r => r.status === 'pending').length} pending requests</p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        {[
          { label: 'Total Requests', value: leaveRequests.length, color: 'var(--primary)' },
          { label: 'Pending', value: leaveRequests.filter(r => r.status === 'pending').length, color: 'var(--warning)' },
          { label: 'Approved', value: leaveRequests.filter(r => r.status === 'approved').length, color: 'var(--success)' },
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
              <tr key={req.id}>
                <td style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.id}</td>
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
                        <button className="btn-icon" style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }} onClick={() => handleApprove(req.id, req.employeeName)} title="Approve">
                          <CheckCircle size={13} />
                        </button>
                        <button className="btn-icon danger" onClick={() => setRejectModal(req)} title="Reject"><XCircle size={13} /></button>
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
              {viewReq.status === 'pending' && (
                <>
                  <button className="btn btn-danger" onClick={() => { setRejectModal(viewReq); setViewReq(null); }}>Reject</button>
                  <button className="btn btn-success" onClick={() => handleApprove(viewReq.id, viewReq.employeeName)}>Approve</button>
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
              ['Request ID', viewReq.id], ['Leave Type', viewReq.leaveType],
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
    </div>
  );
};

export default LeaveRequests;
