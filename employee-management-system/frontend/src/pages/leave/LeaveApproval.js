import React, { useState } from 'react';
import { CheckCircle, XCircle, User } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import toast from 'react-hot-toast';

const LeaveApproval = () => {
  const { leaveRequests, updateLeaveStatus, leaveBalances } = useApp();
  const [viewReq, setViewReq] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [action, setAction] = useState(null);

  const pending = leaveRequests.filter(r => r.status === 'pending');

  const handleApprove = (req) => {
    updateLeaveStatus(req.id, 'approved');
    toast.success(`Leave approved for ${req.employeeName}`);
    setViewReq(null);
    setAction(null);
  };

  const handleReject = (req) => {
    updateLeaveStatus(req.id, 'rejected', rejectReason);
    toast.error(`Leave rejected`);
    setViewReq(null);
    setAction(null);
    setRejectReason('');
  };

  const getBalance = (empId, type) => {
    const bal = leaveBalances.find(b => b.employeeId === empId);
    if (!bal) return null;
    const key = type.split(' ')[0].toLowerCase();
    return bal[key];
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Leave</span><span className="breadcrumb-sep">/</span><span>Approval</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Leave Approval</h1>
            <p className="page-subtitle">{pending.length} requests awaiting your approval</p>
          </div>
        </div>
      </div>

      {pending.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><CheckCircle size={32} color="var(--success)" /></div>
          <div className="empty-state-title">All caught up!</div>
          <div className="empty-state-desc">No pending leave requests require your attention.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {pending.map(req => {
            const bal = getBalance(req.employeeId, req.leaveType);
            return (
              <div key={req.id} className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
                  <Avatar name={req.employeeName} size="lg" />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div>
                        <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>{req.employeeName}</h3>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{req.department} · Applied {req.appliedDate}</div>
                      </div>
                      <Badge status="pending" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
                      {[
                        ['Leave Type', req.leaveType],
                        ['From', req.startDate],
                        ['To', req.endDate],
                        ['Duration', `${req.days} day${req.days > 1 ? 's' : ''}`],
                      ].map(([k, v]) => (
                        <div key={k} style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{k}</div>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{v}</div>
                        </div>
                      ))}
                    </div>
                    {req.reason && (
                      <div style={{ background: 'var(--bg)', borderRadius: 8, padding: '10px 12px', marginBottom: 12 }}>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>Reason</div>
                        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{req.reason}</p>
                      </div>
                    )}
                    {bal && (
                      <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Leave Balance: <strong style={{ color: 'var(--primary)' }}>{bal.total - bal.used} remaining</strong> of {bal.total} days
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: 10 }}>
                      <button className="btn btn-success btn-sm" onClick={() => handleApprove(req)}>
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => { setViewReq(req); setAction('reject'); }}>
                        <XCircle size={14} /> Reject
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => { setViewReq(req); setAction('view'); }}>
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewReq && action === 'reject' && (
        <Modal open={true} onClose={() => { setViewReq(null); setAction(null); }} title="Reject Leave Request" size="sm"
          footer={<><button className="btn btn-outline" onClick={() => { setViewReq(null); setAction(null); }}>Cancel</button><button className="btn btn-danger" onClick={() => handleReject(viewReq)}>Reject Leave</button></>}>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: 16 }}>
            Rejecting <strong>{viewReq.leaveType}</strong> request for <strong>{viewReq.employeeName}</strong>
          </p>
          <div className="form-group">
            <label className="form-label">Rejection Reason</label>
            <textarea className="form-control" rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Provide a reason..." />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LeaveApproval;
