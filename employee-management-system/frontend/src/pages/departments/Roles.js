import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

const RoleForm = ({ initial, departments, onSave, onClose }) => {
  const [form, setForm] = useState(initial || { name: '', department: '', description: '', status: 'active' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
        <div className="form-group">
          <label className="form-label">Role / Designation <span className="required">*</span></label>
          <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Senior Developer" />
        </div>
        <div className="form-group">
          <label className="form-label">Department <span className="required">*</span></label>
          <select className="form-control form-select" required value={form.department} onChange={e => set('department', e.target.value)}>
            <option value="">Select department</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Role responsibilities..." />
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? 'Update' : 'Create'} Role</button>
      </div>
    </form>
  );
};

const Roles = () => {
  const { designations, setDesignations, departments, employees } = useApp();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const filtered = designations.filter(d => {
    const s = search.toLowerCase();
    return (d.name.toLowerCase().includes(s) || d.department.toLowerCase().includes(s)) &&
      (!deptFilter || d.department === deptFilter);
  });

  const empCount = (name) => employees.filter(e => e.designation === name).length;

  const handleSave = (form) => {
    if (editItem) {
      setDesignations(prev => prev.map(d => d.id === editItem.id ? { ...d, ...form } : d));
      toast.success('Role updated');
    } else {
      setDesignations(prev => [...prev, { ...form, id: Date.now(), employeeCount: 0 }]);
      toast.success('Role created');
    }
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDelete = () => {
    setDesignations(prev => prev.filter(d => d.id !== deleteItem.id));
    toast.success('Role deleted');
    setDeleteItem(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Employees</span><span className="breadcrumb-sep">/</span><span>Roles & Designations</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Roles & Designations</h1>
            <p className="page-subtitle">{designations.length} roles configured across all departments</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus size={14} /> Add Role
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="search-input-wrapper" style={{ flex: 1 }}>
            <Search size={14} className="search-icon" />
            <input className="form-control" placeholder="Search roles..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="form-control form-select" style={{ width: 180 }} value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th>#</th><th>Role / Designation</th><th>Department</th><th>Description</th><th>Employees</th><th>Status</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((role, i) => (
              <tr key={role.id}>
                <td style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{i + 1}</td>
                <td><span style={{ fontWeight: 600 }}>{role.name}</span></td>
                <td><span className="badge badge-primary" style={{ fontSize: '0.75rem' }}>{role.department}</span></td>
                <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', maxWidth: 300 }}>{role.description || '—'}</td>
                <td><span style={{ fontWeight: 600 }}>{empCount(role.name)}</span></td>
                <td><Badge status={role.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon" onClick={() => { setEditItem(role); setModalOpen(true); }}><Edit2 size={13} /></button>
                    <button className="btn-icon danger" onClick={() => setDeleteItem(role)}><Trash2 size={13} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No roles found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Role' : 'Add Role'} size="md">
        <RoleForm initial={editItem} departments={departments} onSave={handleSave} onClose={() => { setModalOpen(false); setEditItem(null); }} />
      </Modal>

      <ConfirmModal open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Role" message={`Delete role "${deleteItem?.name}"? This action cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
};

export default Roles;
