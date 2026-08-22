import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Users, Building2, Search } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Modal, { ConfirmModal } from '../../components/shared/Modal';
import Badge from '../../components/shared/Badge';
import toast from 'react-hot-toast';

const DeptForm = ({ initial, onSave, onClose }) => {
  const [form, setForm] = useState(initial || { name: '', manager: '', status: 'active', description: '' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <form onSubmit={e => { e.preventDefault(); onSave(form); }}>
      <div className="form-group">
        <label className="form-label">Department Name <span className="required">*</span></label>
        <input className="form-control" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Engineering" />
      </div>
      <div className="form-group">
        <label className="form-label">Department Manager</label>
        <input className="form-control" value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Manager name" />
      </div>
      <div className="form-group">
        <label className="form-label">Description</label>
        <textarea className="form-control" rows={3} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Brief description of this department" />
      </div>
      <div className="form-group">
        <label className="form-label">Status</label>
        <select className="form-control form-select" value={form.status} onChange={e => set('status', e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      <div className="modal-footer" style={{ margin: '0 -24px -24px', borderTop: '1px solid var(--border)' }}>
        <button type="button" className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary">{initial ? 'Update' : 'Create'} Department</button>
      </div>
    </form>
  );
};

const Departments = () => {
  const { departments, addDepartment, updateDepartment, deleteDepartment, employees } = useApp();
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const filtered = departments.filter(d => d.name.toLowerCase().includes(search.toLowerCase()));
  const empCount = (name) => employees.filter(e => e.department === name).length;

  const handleSave = (form) => {
    if (editItem) {
      updateDepartment(editItem.id, form);
      toast.success('Department updated');
    } else {
      addDepartment({ ...form, employeeCount: 0 });
      toast.success('Department created');
    }
    setModalOpen(false);
    setEditItem(null);
  };

  const handleDelete = () => {
    deleteDepartment(deleteItem.id);
    toast.success('Department deleted');
    setDeleteItem(null);
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb"><span>Employees</span><span className="breadcrumb-sep">/</span><span>Departments</span></div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Departments</h1>
            <p className="page-subtitle">{departments.length} departments configured</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setEditItem(null); setModalOpen(true); }}>
            <Plus size={14} /> Add Department
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, padding: '14px 20px' }}>
        <div className="search-input-wrapper">
          <Search size={14} className="search-icon" />
          <input className="form-control" placeholder="Search departments..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {filtered.map(dept => (
          <div key={dept.id} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={22} color="var(--primary)" />
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button className="btn-icon" onClick={() => { setEditItem(dept); setModalOpen(true); }}><Edit2 size={13} /></button>
                <button className="btn-icon danger" onClick={() => setDeleteItem(dept)}><Trash2 size={13} /></button>
              </div>
            </div>
            <h3 style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{dept.name}</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 12, lineHeight: 1.5 }}>{dept.description}</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <Users size={14} /> {empCount(dept.name)} employees
              </div>
              <Badge status={dept.status} />
            </div>
            {dept.manager && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Manager: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{dept.manager}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditItem(null); }} title={editItem ? 'Edit Department' : 'Add Department'} size="md">
        <DeptForm initial={editItem} onSave={handleSave} onClose={() => { setModalOpen(false); setEditItem(null); }} />
      </Modal>

      <ConfirmModal open={!!deleteItem} onClose={() => setDeleteItem(null)} onConfirm={handleDelete}
        title="Delete Department" message={`Delete "${deleteItem?.name}" department? This action cannot be undone.`} confirmLabel="Delete" />
    </div>
  );
};

export default Departments;
