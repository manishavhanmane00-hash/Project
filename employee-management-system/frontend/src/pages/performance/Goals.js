import React, { useState } from 'react';
import { Plus, Target, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Modal from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

// No demo goals — starts empty, all goals are user-created
const priorityColor = { high: 'var(--danger)', medium: 'var(--warning)', low: 'var(--success)' };
const priorityBg    = { high: 'var(--danger-light)', medium: 'var(--warning-light)', low: 'var(--success-light)' };

const GoalCard = ({ goal }) => (
  <div className="card" style={{ padding: 20 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span style={{
            background: priorityBg[goal.priority], color: priorityColor[goal.priority],
            fontSize: '0.7rem', fontWeight: 600, padding: '2px 8px', borderRadius: 20, textTransform: 'capitalize',
          }}>
            {goal.priority} priority
          </span>
          <span className="badge badge-primary" style={{ fontSize: '0.7rem' }}>{goal.category}</span>
        </div>
        <h4 style={{ fontWeight: 600, fontSize: '0.95rem', marginBottom: 4 }}>{goal.title}</h4>
        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{goal.description}</p>
      </div>
      <Badge status={goal.status} />
    </div>

    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
      <Avatar name={goal.employeeName} size="xs" />
      <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{goal.employeeName}</span>
      {goal.dueDate && (
        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
          Due: {goal.dueDate}
        </span>
      )}
    </div>

    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Progress</span>
        <span style={{
          fontSize: '0.8rem', fontWeight: 600,
          color: goal.progress === 100 ? 'var(--success)' : 'var(--primary)',
        }}>
          {goal.progress}%
        </span>
      </div>
      <div className="progress-bar">
        <div className="progress-fill" style={{
          width: `${goal.progress}%`,
          background: goal.progress === 100 ? 'var(--success)'
            : goal.progress >= 70 ? 'var(--primary)'
            : goal.progress >= 40 ? 'var(--warning)'
            : 'var(--danger)',
        }} />
      </div>
    </div>
  </div>
);

const GoalForm = ({ employees, onSave, onClose }) => {
  const [form, setForm] = useState({
    employeeId: '', title: '', category: 'Project', dueDate: '',
    priority: 'medium', description: '', progress: 0, status: 'in-progress',
  });
  const emp = employees.find(e => e._id === form.employeeId || e._id?.toString() === form.employeeId);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={e => {
      e.preventDefault();
      if (!form.employeeId || !form.title) { toast.error('Employee and title are required'); return; }
      onSave({
        ...form,
        id:           Date.now(),
        employeeName: emp?.name       || form.employeeId,
        department:   emp?.department || '',
      });
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Employee <span className="required">*</span></label>
          <select className="form-control form-select" required value={form.employeeId} onChange={e => set('employeeId', e.target.value)}>
            <option value="">Select employee</option>
            {employees.map(e => <option key={e._id} value={e._id}>{e.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Category</label>
          <select className="form-control form-select" value={form.category} onChange={e => set('category', e.target.value)}>
            {['Project','Revenue','Team','Client','Marketing','HR','Learning','Process','Other'].map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Goal Title <span className="required">*</span></label>
          <input className="form-control" required value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Reduce average time-to-hire to 20 days" />
        </div>

        <div className="form-group">
          <label className="form-label">Due Date</label>
          <input type="date" className="form-control" value={form.dueDate} onChange={e => set('dueDate', e.target.value)} />
        </div>
        <div className="form-group">
          <label className="form-label">Priority</label>
          <select className="form-control form-select" value={form.priority} onChange={e => set('priority', e.target.value)}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Progress (%)</label>
          <input type="number" className="form-control" min="0" max="100"
            value={form.progress} onChange={e => set('progress', Number(e.target.value))} />
        </div>
        <div className="form-group">
          <label className="form-label">Status</label>
          <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
          </select>
        </div>

        <div className="form-group" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description</label>
          <textarea className="form-control" rows={3} value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Goal description and success criteria…" />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">Create Goal</button>
      </div>
    </form>
  );
};

const Goals = () => {
  const { employees } = useApp();
  const [goals,      setGoals]      = useState([]);   // starts empty — no demo data
  const [modalOpen,  setModalOpen]  = useState(false);
  const [filter,     setFilter]     = useState('all');
  const [deptFilter, setDeptFilter] = useState('');

  const filtered = goals.filter(g => {
    const matchStatus = filter === 'all' || g.status === filter;
    const matchDept   = !deptFilter      || g.department === deptFilter;
    return matchStatus && matchDept;
  });

  const stats = {
    total:       goals.length,
    completed:   goals.filter(g => g.status === 'completed').length,
    inProgress:  goals.filter(g => g.status === 'in-progress').length,
    avgProgress: goals.length > 0
      ? Math.round(goals.reduce((s, g) => s + g.progress, 0) / goals.length)
      : 0,
  };

  const handleSave = (goal) => {
    setGoals(prev => [goal, ...prev]);
    toast.success('Goal created');
    setModalOpen(false);
  };

  const depts = [...new Set(goals.map(g => g.department).filter(Boolean))];

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Performance</span><span className="breadcrumb-sep">/</span><span>Goals & KPIs</span>
        </div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Goals & KPIs</h1>
            <p className="page-subtitle">Track employee goals and key performance indicators</p>
          </div>
          <button className="btn btn-primary" onClick={() => setModalOpen(true)}>
            <Plus size={14} /> Add Goal
          </button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { icon: Target,       label: 'Total Goals',    value: stats.total,       color: 'var(--primary)', bg: 'var(--primary-light)' },
          { icon: CheckCircle,  label: 'Completed',      value: stats.completed,   color: 'var(--success)', bg: 'var(--success-light)' },
          { icon: Clock,        label: 'In Progress',    value: stats.inProgress,  color: 'var(--info)',    bg: 'var(--info-light)'    },
          { icon: AlertCircle,  label: 'Avg Progress',   value: `${stats.avgProgress}%`, color: 'var(--warning)', bg: 'var(--warning-light)' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className="stat-card-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div className="stat-card-value">{s.value}</div>
            <div className="stat-card-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '12px 16px' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 6 }}>
            {[['all','All'],['in-progress','In Progress'],['completed','Completed'],['pending','Pending']].map(([v, l]) => (
              <button key={v} className={`btn btn-sm ${filter === v ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setFilter(v)}>{l}
              </button>
            ))}
          </div>
          {depts.length > 0 && (
            <select className="form-control form-select" style={{ width: 180 }} value={deptFilter}
              onChange={e => setDeptFilter(e.target.value)}>
              <option value="">All Departments</option>
              {depts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          )}
          <span style={{ marginLeft: 'auto', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {filtered.length} goal{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Goals grid or empty state */}
      {filtered.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
          {filtered.map(goal => <GoalCard key={goal.id} goal={goal} />)}
        </div>
      ) : (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Target size={32} color="var(--text-muted)" />
          </div>
          <div className="empty-state-title">No goals yet</div>
          <div className="empty-state-desc">
            {goals.length === 0
              ? 'Create goals to track employee performance and KPIs'
              : 'No goals match the current filter'}
          </div>
          {goals.length === 0 && (
            <button className="btn btn-primary" style={{ marginTop: 4 }} onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Add First Goal
            </button>
          )}
        </div>
      )}

      {/* Add Goal Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add New Goal" size="lg">
        <GoalForm employees={employees} onSave={handleSave} onClose={() => setModalOpen(false)} />
      </Modal>
    </div>
  );
};

export default Goals;
