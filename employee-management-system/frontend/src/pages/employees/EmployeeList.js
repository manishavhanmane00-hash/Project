import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Filter, Download, Eye, Edit2, Trash2, MoreVertical, ChevronUp, ChevronDown } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import Avatar from '../../components/shared/Avatar';
import Badge from '../../components/shared/Badge';
import Pagination from '../../components/shared/Pagination';
import { ConfirmModal } from '../../components/shared/Modal';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

const EmployeeList = () => {
  const { employees, departments, deleteEmployee } = useApp();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const filtered = useMemo(() => {
    let list = [...employees];
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(e => e.name.toLowerCase().includes(s) || e.email.toLowerCase().includes(s) || e.id.toLowerCase().includes(s));
    }
    if (deptFilter) list = list.filter(e => e.department === deptFilter);
    if (statusFilter) list = list.filter(e => e.status === statusFilter);
    if (typeFilter) list = list.filter(e => e.employmentType?.toLowerCase() === typeFilter.toLowerCase());
    list.sort((a, b) => {
      let av = a[sortBy] || '', bv = b[sortBy] || '';
      if (typeof av === 'string') { av = av.toLowerCase(); bv = bv.toLowerCase(); }
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return list;
  }, [employees, search, deptFilter, statusFilter, typeFilter, sortBy, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ col }) => sortBy === col
    ? (sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />)
    : null;

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteEmployee(confirmDelete._id);
      toast.success(`${confirmDelete.name} removed successfully`);
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err.message || 'Failed to delete employee');
    } finally {
      setDeleting(false);
    }
  };

  const handleExport = () => {
    const csv = ['ID,Name,Email,Phone,Department,Designation,Type,Status'].concat(
      filtered.map(e => `${e.id},${e.name},${e.email},${e.phone},${e.department},${e.designation},${e.employmentType},${e.status}`)
    ).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click();
    toast.success('Exported employees list');
  };

  return (
    <div>
      <div className="page-header">
        <div className="breadcrumb">
          <span>Employees</span><span className="breadcrumb-sep">/</span><span>Employee List</span>
        </div>
        <div className="page-header-top">
          <div>
            <h1 className="page-title">Employees</h1>
            <p className="page-subtitle">{employees.length} total employees in the system</p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn btn-outline btn-sm" onClick={handleExport}>
              <Download size={14} /> Export
            </button>
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/employees/add')}>
              <Plus size={14} /> Add Employee
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: 20, padding: '16px 20px' }}>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={14} className="search-icon" />
            <input className="form-control" placeholder="Search by name, email or ID..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>
          <select className="form-control form-select" style={{ width: 160 }} value={deptFilter}
            onChange={e => { setDeptFilter(e.target.value); setPage(1); }}>
            <option value="">All Departments</option>
            {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
          </select>
          <select className="form-control form-select" style={{ width: 140 }} value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="on-leave">On Leave</option>
          </select>
          <select className="form-control form-select" style={{ width: 150 }} value={typeFilter}
            onChange={e => { setTypeFilter(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            <option value="Full-time">Full-time</option>
            <option value="Part-time">Part-time</option>
            <option value="Contract">Contract</option>
            <option value="Intern">Intern</option>
          </select>
          {(search || deptFilter || statusFilter || typeFilter) && (
            <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setDeptFilter(''); setStatusFilter(''); setTypeFilter(''); setPage(1); }}>
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="table">
          <thead>
            <tr>
              <th className="sortable" onClick={() => handleSort('id')}>ID <SortIcon col="id" /></th>
              <th className="sortable" onClick={() => handleSort('name')}>Employee <SortIcon col="name" /></th>
              <th>Contact</th>
              <th className="sortable" onClick={() => handleSort('department')}>Department <SortIcon col="department" /></th>
              <th>Designation</th>
              <th className="sortable" onClick={() => handleSort('joiningDate')}>Joining Date <SortIcon col="joiningDate" /></th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr><td colSpan={9}>
                <div className="empty-state">
                  <div className="empty-state-icon"><Search size={28} /></div>
                  <div className="empty-state-title">No employees found</div>
                  <div className="empty-state-desc">Try adjusting your filters or search terms</div>
                </div>
              </td></tr>
            ) : paginated.map(emp => (
              <tr key={emp._id}>
                <td><span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{emp.id}</span></td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Avatar name={emp.name} size="sm" />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{emp.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{emp.email}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <div style={{ fontSize: '0.8rem' }}>{emp.phone}</div>
                </td>
                <td><span style={{ fontSize: '0.875rem' }}>{emp.department}</span></td>
                <td><span style={{ fontSize: '0.875rem' }}>{emp.designation}</span></td>
                <td><span style={{ fontSize: '0.8rem' }}>{emp.joiningDate}</span></td>
                <td><Badge status={emp.employmentType?.toLowerCase()} label={emp.employmentType} dot={false} /></td>
                <td><Badge status={emp.status} /></td>
                <td>
                  <div className="table-actions">
                    <button className="btn-icon primary" title="View Profile" onClick={() => navigate(`/employees/${emp._id}`)}>
                      <Eye size={14} />
                    </button>
                    <button className="btn-icon" title="Edit" onClick={() => navigate(`/employees/edit/${emp._id}`)}>
                      <Edit2 size={14} />
                    </button>
                    <button className="btn-icon danger" title="Delete" onClick={() => setConfirmDelete(emp)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        totalItems={filtered.length}
        pageSize={PAGE_SIZE}
        onPageChange={setPage}
      />

      <ConfirmModal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDelete}
        loading={deleting}
        title="Delete Employee"
        message={`Are you sure you want to delete ${confirmDelete?.name}? This action cannot be undone.`}
        confirmLabel="Delete"
      />
    </div>
  );
};

export default EmployeeList;
