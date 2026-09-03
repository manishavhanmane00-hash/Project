import React, { useState, useMemo } from 'react';
import { Star } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';

const TABS = ['Performance Summary', 'Goals & KPIs', 'Reviews'];

const StarDisplay = ({ value, max = 5 }) => (
  <div style={{ display: 'flex', gap: 2 }}>
    {[...Array(max)].map((_, i) => (
      <Star
        key={i}
        size={18}
        fill={i < value ? '#f59e0b' : 'none'}
        color={i < value ? '#f59e0b' : 'var(--border)'}
      />
    ))}
    <span style={{ marginLeft: 6, fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
      {value > 0 ? `${value}/5` : 'N/A'}
    </span>
  </div>
);

const EmployeePerformance = () => {
  const { performanceReviews } = useApp();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [viewReview, setViewReview] = useState(null);

  const myReviews = useMemo(() =>
    performanceReviews
      .filter(r => r.employeeId === user?.id || r.email === user?.email)
      .sort((a, b) => (b.reviewDate || '').localeCompare(a.reviewDate || '')),
    [performanceReviews, user]
  );

  const latestReview = myReviews[0] || null;
  const prevReview   = myReviews[1] || null;

  const avgRating = myReviews.length > 0
    ? (myReviews.reduce((s, r) => s + (r.overallRating || 0), 0) / myReviews.length).toFixed(1)
    : 0;

  // Goals from reviews
  const allGoals = useMemo(() => {
    const goals = [];
    myReviews.forEach(r => {
      if (r.goals && r.goals.length > 0 && Array.isArray(r.goals)) {
        r.goals.forEach(g => goals.push(g));
      }
    });
    return goals;
  }, [myReviews]);

  const renderSummary = () => (
    <div>
      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Current Rating',   value: latestReview ? `${latestReview.overallRating}★` : 'N/A', color: 'var(--warning)' },
          { label: 'Previous Rating',  value: prevReview   ? `${prevReview.overallRating}★`   : 'N/A', color: 'var(--info)'    },
          { label: 'Total Reviews',    value: myReviews.length,                                        color: 'var(--primary)' },
          { label: 'Avg Rating',       value: avgRating > 0 ? `${avgRating}★` : 'N/A',                color: 'var(--success)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {latestReview ? (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Latest Review — {latestReview.reviewPeriod}</h3>
            <Badge status={latestReview.status} />
          </div>
          <div className="card-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
              {[['Overall Rating', latestReview.overallRating], ['Goals', latestReview.goals], ['KPIs', latestReview.kpis]].map(([label, val]) => (
                <div key={label} style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{label}</div>
                  <StarDisplay value={val || 0} />
                </div>
              ))}
            </div>

            {latestReview.reviewer && (
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16 }}>
                Reviewed by <strong>{latestReview.reviewer}</strong> on {latestReview.reviewDate}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {latestReview.strengths && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--success)' }}>✅ Strengths</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--success-light)', padding: 12, borderRadius: 8 }}>
                    {latestReview.strengths}
                  </p>
                </div>
              )}
              {latestReview.improvements && (
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8, color: 'var(--warning)' }}>🎯 Areas for Improvement</div>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--warning-light)', padding: 12, borderRadius: 8 }}>
                    {latestReview.improvements}
                  </p>
                </div>
              )}
            </div>

            {latestReview.managerComments && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>💬 Manager Feedback</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  "{latestReview.managerComments}"
                </p>
              </div>
            )}

            {latestReview.employeeComments && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 8 }}>🗣️ My Comments</div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>
                  {latestReview.employeeComments}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>⭐</div>
          <div className="empty-state-title">No performance reviews yet</div>
          <div className="empty-state-desc">Your performance reviews will appear here once completed by your manager</div>
        </div>
      )}
    </div>
  );

  const renderGoals = () => (
    <div>
      {allGoals.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>🎯</div>
          <div className="empty-state-title">No goals assigned yet</div>
          <div className="empty-state-desc">Goals assigned to you by your manager will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {allGoals.map((goal, i) => (
            <div key={i} className="card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{goal.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{goal.description}</p>
                </div>
                <Badge status={goal.status} />
              </div>
              {goal.dueDate && (
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Due: {goal.dueDate}
                </div>
              )}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress</span>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: (goal.progress || 0) === 100 ? 'var(--success)' : 'var(--primary)' }}>
                    {goal.progress || 0}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{
                    width: `${goal.progress || 0}%`,
                    background: (goal.progress || 0) === 100 ? 'var(--success)' : 'var(--primary)',
                  }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviews = () => (
    <div>
      {myReviews.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📋</div>
          <div className="empty-state-title">No reviews yet</div>
          <div className="empty-state-desc">Performance reviews from your manager will appear here</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {myReviews.map(rev => (
            <div key={rev._id || rev.id} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontWeight: 700, marginBottom: 4 }}>{rev.reviewPeriod}</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Reviewed by {rev.reviewer || 'Manager'} on {rev.reviewDate}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Badge status={rev.status} />
                  <button className="btn btn-outline btn-sm" onClick={() => setViewReview(rev)}>View Details</button>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 24, marginBottom: 12 }}>
                {[['Overall', rev.overallRating], ['Goals', rev.goals], ['KPIs', rev.kpis]].map(([label, val]) => (
                  <div key={label}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
                    <StarDisplay value={val || 0} />
                  </div>
                ))}
              </div>
              {rev.managerComments && (
                <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', borderRadius: 8, padding: '10px 12px' }}>
                  "{rev.managerComments}"
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {viewReview && (
        <Modal open={true} onClose={() => setViewReview(null)} title="Performance Review Details" size="lg">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{viewReview.reviewPeriod}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Reviewed by {viewReview.reviewer || 'Manager'} · {viewReview.reviewDate}
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[['Overall Rating', viewReview.overallRating], ['Goals', viewReview.goals], ['KPIs', viewReview.kpis]].map(([l, v]) => (
              <div key={l} style={{ background: 'var(--bg)', borderRadius: 10, padding: 16, textAlign: 'center' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 8 }}>{l}</div>
                <StarDisplay value={v || 0} />
              </div>
            ))}
          </div>
          {[['✅ Strengths', viewReview.strengths], ['🎯 Areas for Improvement', viewReview.improvements], ['💬 Manager Comments', viewReview.managerComments], ['🗣️ My Comments', viewReview.employeeComments]].map(([k, v]) => v && (
            <div key={k} style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, fontSize: '0.875rem', marginBottom: 6 }}>{k}</div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6, background: 'var(--bg)', padding: 12, borderRadius: 8 }}>{v}</p>
            </div>
          ))}
        </Modal>
      )}
    </div>
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">My Performance</h1>
        <p className="page-subtitle">View your performance reviews, ratings, and goals</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div className="tabs" style={{ padding: '0 24px' }}>
          {TABS.map((t, i) => (
            <div key={t} className={`tab ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>{t}</div>
          ))}
        </div>
        <div className="card-body">
          {activeTab === 0 && renderSummary()}
          {activeTab === 1 && renderGoals()}
          {activeTab === 2 && renderReviews()}
        </div>
      </div>
    </div>
  );
};

export default EmployeePerformance;
