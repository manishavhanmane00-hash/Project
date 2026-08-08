import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * CustomersList — Admin view of all registered customers with order stats
 */
export default function CustomersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/users');
        setUsers(data.data);
      } catch {
        toast.error('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-people me-2"></i>Customers
        <span className="badge bg-secondary ms-2">{users.length}</span>
      </h4>

      {/* Search */}
      <div className="card-cafe p-3 mb-4">
        <div className="input-group">
          <span className="input-group-text"><i className="bi bi-search"></i></span>
          <input
            type="text"
            className="form-control"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="card-cafe p-3">
        {loading ? (
          <div className="text-center py-4"><div className="spinner-border spinner-cafe" role="status" /></div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover table-cafe mb-0">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Email</th>
                  <th>Total Orders</th>
                  <th>Total Spent</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={7} className="text-center text-muted py-4">No customers found</td></tr>
                ) : filtered.map((user, idx) => (
                  <tr key={user._id}>
                    <td className="text-muted">{idx + 1}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <div
                          className="rounded-circle d-flex align-items-center justify-content-center fw-bold text-white"
                          style={{ width: 34, height: 34, background: 'var(--cafe-brown-light)', fontSize: '0.85rem', flexShrink: 0 }}
                          aria-hidden="true"
                        >
                          {user.name[0].toUpperCase()}
                        </div>
                        <span className="fw-semibold">{user.name}</span>
                      </div>
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.85rem' }}>{user.email}</td>
                    <td>
                      <span className="badge bg-light text-dark border">{user.orderCount}</span>
                    </td>
                    <td className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>
                      ₹{user.totalSpent.toLocaleString()}
                    </td>
                    <td>
                      {user.isActive ? (
                        <span className="badge bg-success">Online</span>
                      ) : (
                        <span className="badge bg-secondary">Offline</span>
                      )}
                    </td>
                    <td className="text-muted" style={{ fontSize: '0.8rem' }}>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
