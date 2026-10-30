import React, { useState, useMemo } from 'react';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import toast from 'react-hot-toast';

// The "Earned" screenshot label is stored as "Annual Leave" (see Req 3.3 / 18.1).
// This map lets us surface a friendly display label while reading the stored type.
const DISPLAY_LABELS = {
  'Annual Leave': 'Earned (Annual Leave)',
};

const LeaveBalance = () => {
  const { leaveBalances, leaveRequests, updateLeaveStatus } = useApp();
  const { user } = useAuth();

  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [busyId, setBusyId] = useState(null);

  // Only Admin and HR may approve/reject. Managers are explicitly excluded from
  // leave approval actions (Req 16.4), matching the backend restriction.
  const canDecide = user?.role === 'Admin' || user?.role === 'HR';

  // Pending records awaiting a decision (Req 4.1).
  const pendingRequests = useMemo(
    () => leaveRequests.filter(r => r.status === 'pending'),
    [leaveRequests]
  );

  // A guard reused for the UI: an approver cannot act on their own request (Req 4.4).
  const isSelf = (req) => {
    const approverId = user?.id || user?._id;
    const ownerId = (req.userId && req.userId.toString?.()) || req.userId;
    return !!approverId && !!ownerId && ownerId.toString() === approverId.toString();
  };

  const handleApprove = async (req) => {
    const id = req._id || req.id;
    // Already-decided guard reflected in UI messaging (Req 4.3).
    if (req.status !== 'pending') {
      toast.error(`This request has already been ${req.status}`);
      return;
    }
    // Self-approval guard reflected in UI messaging (Req 4.4).
    if (isSelf(req)) {
      toast.error('You cannot approve your own leave request');
      return;
    }
    setBusyId(id);
    try {
      await updateLeaveStatus(id, 'approved');
      toast.success(`Leave approved for ${req.employeeName}`);
    } catch (err) {
      toast.error(err.message || 'Failed to approve leave');
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (req) => {
    if (req.status !== 'pending') {
      toast.error(`This request has already been ${req.status}`);
      return;
    }
    setRejectReason('');
    setRejectModal(req);
  };

  const handleReject = async () => {
    const id = rejectModal._id || rejectModal.id;
    setBusyId(id);
    try {
      await updateLeaveStatus(id, 'rejected', rejectReason);
      toast.success(`Leave rejected for ${rejectModal.employeeName}`);
      setRejectModal(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.message || 'Failed to reject leave');
    } finally {
      setBusyId(null);
    }
  };

  const renderRemaining = (bal) => {
    // Untracked types (entitlement 0, e.g. Unpaid Leave) surface as "Unlimited" (Req 3.2).
    if (bal.remaining === 'Unlimited' || bal.entitlement === 0) {
      return <span style={{ fontWeight: 600, color: 'var(--info)' }}>Unlimited</span>;
    }
    const remaining = Number(bal.remaining);
    const color = remaining > 5 ? 'var(--success)' : remaining > 2 ? 'var(--warning)' : 'var(--danger)';
    return <span style={{ fontWeight: 600, color }}>{remaining} days</span>;
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Leave Balance</span></div>
        <h1 className="page-title">Leave Balance</h1>
        <p className="page-subtitle">Entitlement, used, and remaining balance per leave type</p>
      </div>

      {/* Per-type balance table (Req 3.1, 3.2, 3.3) */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3 className="card-title">My Leave Balance</h3>
        </div>
        {leaveBalances.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-title">No balance data</div>
            <div className="empty-state-desc">Your leave balances will appear here once your account is set up.</div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>Entitlement</th>
                  <th>Used</th>
                  <th>Remaining</th>
                </tr>
              </thead>
              <tbody>
                {leaveBalances.map(bal => {
                  const untracked = bal.remaining === 'Unlimited' || bal.entitlement === 0;
                  const label = DISPLAY_LABELS[bal.leaveType] || bal.leaveType;
                  return (
                    <tr key={bal.leaveType}>
                      <td style={{ fontWeight: 600, fontSize: '0.875rem' }}>{label}</td>
                      <td>{untracked ? '—' : `${bal.entitlement} days`}</td>
                      <td>
                        <span style={{ color: 'var(--text-secondary)' }}>{bal.used || 0} days</span>
                      </td>
                      <td>{renderRemaining(bal)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pending approvals — visible only for Admin/HR (Req 4.1) */}
      {canDecide && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Pending Approvals</h3>
            <span className="badge badge-warning">{pendingRequests.length} pending</span>
          </div>

          {pendingRequests.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-title">No pending requests</div>
              <div className="empty-state-desc">Leave requests awaiting a decision will appear here.</div>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Employee</th><th>Leave Type</th><th>From</th><th>To</th>
                    <th>Days</th><th>Status</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map(req => {
                    const id = req._id || req.id;
                    const self = isSelf(req);
                    const busy = busyId === id;
                    return (
                      <tr key={id}>
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
                        <td><Badge status={req.status} /></td>
                        <td>
                          {self ? (
                            // Self-approval guard reflected in disabled state + messaging (Req 4.4).
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              <Info size={13} /> Your own request
                            </span>
                          ) : (
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                style={{ color: 'var(--success)', borderColor: 'var(--success-light)' }}
                                onClick={() => handleApprove(req)}
                                disabled={busy}
                                title="Approve"
                              >
                                <CheckCircle size={13} />
                              </button>
                              <button
                                className="btn-icon danger"
                                onClick={() => openReject(req)}
                                disabled={busy}
                                title="Reject"
                              >
                                <XCircle size={13} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal open={true} onClose={() => setRejectModal(null)} title="Reject Leave Request" size="sm"
          footer={
            <>
              <button className="btn btn-outline" onClick={() => setRejectModal(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleReject} disabled={busyId === (rejectModal._id || rejectModal.id)}>Reject Leave</button>
            </>
          }>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Rejecting leave request for <strong>{rejectModal?.employeeName}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <textarea className="form-control" rows={3} placeholder="Provide a reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveBalance;
