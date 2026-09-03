import React, { useState, useCallback } from 'react';
import { Plus, Star, Eye, Edit2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import AIChatPanel from '../../components/ai/AIChatPanel';
import { useAI } from '../../hooks/useAI';
import toast from 'react-hot-toast';

const RATINGS = [
  { value: 1, label: 'Poor', color: 'var(--danger)' },
  { value: 2, label: 'Needs Improvement', color: 'var(--orange)' },
  { value: 3, label: 'Meets Expectations', color: 'var(--warning)' },
  { value: 4, label: 'Very Good', color: 'var(--info)' },
  { value: 5, label: 'Excellent', color: 'var(--success)' },
];

const StarRating = ({ value, onChange, readonly }) => (
  <div className="star-rating">
    {[1,2,3,4,5].map(s => (
      <Star key={s} size={20} fill={s <= value ? '#f59e0b' : 'none'} color={s <= value ? '#f59e0b' : 'var(--border)'}
        className="star" style={{ cursor: readonly ? 'default' : 'pointer' }}
        onClick={() => !readonly && onChange && onChange(s)} />
    ))}
    {value > 0 && <span style={{ marginLeft: 6, fontSize: '0.8rem', color: RATINGS[value-1]?.color, fontWeight: 600 }}>{RATINGS[value-1]?.label}</span>}
  </div>
);

const ReviewForm = ({ employees, onSave, onClose, currentUser, saving }) => {
  const [form, setForm] = useState({ employeeId: '', reviewPeriod: 'Q2 2026', reviewer: currentUser?.name || '', overallRating: 0, goals: 0, kpis: 0, strengths: '', improvements: '', managerComments: '', employeeComments: '', status: 'completed' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const emp = employees.find(e => (e._id === form.employeeId || e.id === form.employeeId));
  return (
    <form onSubmit={e => { e.preventDefault(); if (!form.employeeId || !form.overallRating) { toast.error('Select an employee and set an overall rating'); return; } onSave({ ...form, employeeName: emp?.name || form.employeeId, department: emp?.department || '', reviewDate: new Date().toISOString().split('T')[0] }); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Employee <span className="required">*</span></label>
          <select className="form-control form-select" required value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Review Period</label>
          <select className="form-control form-select" value={form.reviewPeriod} onChange={e => set('reviewPeriod', e.target.value)}>
            {['Q1 2026','Q2 2026','Q3 2026','Q4 2026','Annual 2026'].map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Reviewer</label>
          <input className="form-control" value={form.reviewer} onChange={e => set('reviewer', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="completed">Completed</option>
            <option value="in-progress">In Progress</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 16 }}>
        {[['Overall Rating *', 'overallRating'], ['Goals Achievement', 'goals'], ['KPIs Score', 'kpis']].map(([label, key]) => (
          <div key={key}>
            <label className="form-label">{label}</label>
            <StarRating value={form[key]} onChange={v => set(key, v)} />
          </div>
        ))}
      </div>
      {[['Strengths', 'strengths', 'Employee strengths and achievements...'], ['Areas for Improvement', 'improvements', 'Areas where employee needs to improve...'], ['Manager Comments', 'managerComments', 'Manager\'s overall comments...'], ['Employee Comments', 'employeeComments', 'Employee self-assessment...']].map(([label, key, ph]) => (
        <div key={key} className="form-group">
          <label className="form-label">{label}</label>
          <textarea className="form-control" rows={2} value={form[key]} onChange={e => set(key, e.target.value)} placeholder={ph} />
        </div>
      ))}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Review'}</button>
      </div>
    </form>
  );
};

const PerformanceReviews = () => {
  const { performanceReviews, savePerformanceReview, employees } = useApp();
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [viewReview, setViewReview] = useState(null);
  const [saving, setSaving] = useState(false);

  // AI
  const ai = useAI(user);
  const handlePerformanceAI = useCallback(async (message) => {
    const result = await ai.adminChat(message, { employees, attendance: [], leave: [], payroll: [], performance: performanceReviews });
    if (!result) return 'AI Assistant is temporarily unavailable. Please check your connection and try again.';
    if (!result.success) return result.message || 'AI Assistant is temporarily unavailable. Please try again.';
    return result.answer || 'I could not generate a response. Please try rephrasing your question.';
  }, [ai, performanceReviews, employees]);

  const avgRating = performanceReviews.length > 0
    ? (performanceReviews.reduce((s, r) => s + r.overallRating, 0) / performanceReviews.length).toFixed(1)
    : 0;

  const handleSave = async (form) => {
    setSaving(true);
    try {
      // Find the selected employee to get their userId and email for proper linkage
      const emp = employees.find(e => e._id === form.employeeId);
      const reviewData = {
        ...form,
        userId: emp?.userId || null,
        email: emp?.email || '',
      };
      await savePerformanceReview(reviewData);
      toast.success('Performance review saved');
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Failed to save review');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Performance</span><span className="breadcrumb-sep">/</span><span>Reviews</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Performance Reviews</h1>
            <p className="page-subtitle">{performanceReviews.length} reviews completed · Avg rating: {avgRating}/5</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}><Plus size={14} /> New Review</button>
        </div>
      </div>

      {/* Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Avg Rating', value: `${avgRating}★`, color: 'var(--warning)' },
          { label: 'Completed', value: performanceReviews.filter(r => r.status === 'completed').length, color: 'var(--success)' },
          { label: 'Excellent (5★)', value: performanceReviews.filter(r => r.overallRating === 5).length, color: 'var(--primary)' },
          { label: 'Needs Improvement', value: performanceReviews.filter(r => r.overallRating <= 2).length, color: 'var(--danger)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gap: 16 }}>
        {performanceReviews.map(rev => (
          <div key={rev.id} className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
              <Avatar name={rev.employeeName} size="lg" />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div>
                    <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{rev.employeeName}</h3>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{rev.department} · {rev.reviewPeriod} · Reviewed by {rev.reviewer}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <Badge status={rev.status} />
                    <button className="btn-icon primary" onClick={() => setViewReview(rev)}><Eye size={13} /></button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                  {[['Overall', rev.overallRating], ['Goals', rev.goals], ['KPIs', rev.kpis]].map(([label, val]) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                      <StarRating value={val} readonly />
                    </div>
                  ))}
                </div>
                {rev.managerComments && (
                  <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                    "{rev.managerComments}"
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Review Detail Modal */}
      {viewReview && (
        <Modal open={true} onClose={() => setViewReview(null)} title="Performance Review Details" size="lg">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <Avatar name={viewReview.employeeName} size="lg" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{viewReview.employeeName}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{viewReview.reviewPeriod} · {viewReview.reviewDate}</div>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[['Overall Rating', viewReview.overallRating], ['Goals', viewReview.goals], ['KPIs', viewReview.kpis]].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{l}</div>
                <StarRating value={v} readonly />
              </div>
            ))}
          </div>
          {[['Strengths', viewReview.strengths], ['Areas for Improvement', viewReview.improvements], ['Manager Comments', viewReview.managerComments], ['Employee Comments', viewReview.employeeComments]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>{k}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{v}</p>
            </div>
          ))}
        </Modal>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="New Performance Review" size="lg">
        <ReviewForm employees={employees} onSave={handleSave} onClose={() => setModalOpen(false)} currentUser={user} saving={saving} />
      </Modal>

      {/* AI Performance Summary */}
      <div style={{ marginTop: 24 }}>
        <AIChatPanel
          title="AI Performance Summary"
          onSend={handlePerformanceAI}
          loading={ai.loading}
          suggestions={[
            'What is the average performance rating?',
            'Which department performs best?',
            'Who needs improvement?',
            'Summarize performance trends',
          ]}
          placeholder="Ask about performance ratings, trends, department comparisons..."
        />
      </div>
    </div>
  );
};

export default PerformanceReviews;
