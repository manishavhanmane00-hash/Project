import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../../services/api';

/**
 * AdminOverview — Dashboard stat cards + recent orders table
 */
export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, ordersRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/orders?limit=5'),
      ]);
      setStats(statsRes.data.data);
      setRecentOrders(ordersRes.data.data);
    } catch {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (orderId, status) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status });
      toast.success(`Order status → ${status}`);
      fetchData();
    } catch {
      toast.error('Failed to update status');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border spinner-cafe" role="status" />
        <p className="mt-3 text-muted">Loading dashboard...</p>
      </div>
    );
  }

  const statCards = [
    { label: "Today's Orders", value: stats?.todayOrders ?? 0, icon: '📦', color: '#4fc3f7', bg: '#e1f5fe' },
    { label: "Today's Revenue", value: `₹${stats?.todayRevenue ?? 0}`, icon: '💰', color: '#81c784', bg: '#e8f5e9' },
    { label: 'Pending Orders', value: stats?.pendingOrders ?? 0, icon: '⏳', color: '#ffb74d', bg: '#fff3e0' },
    { label: 'Active Users', value: stats?.activeUsers ?? 0, icon: '👥', color: '#ba68c8', bg: '#f3e5f5' },
    { label: 'Total Revenue', value: `₹${stats?.totalRevenue ?? 0}`, icon: '📈', color: '#4db6ac', bg: '#e0f2f1' },
    { label: 'Total Orders', value: stats?.totalOrders ?? 0, icon: '🧾', color: '#f06292', bg: '#fce4ec' },
  ];

  const STATUS_NEXT = {
    Placed: 'Preparing',
    Preparing: 'Ready',
    Ready: 'Out for Delivery',
    'Out for Delivery': 'Completed',
  };

  return (
    <div>
      <h4 className="fw-bold mb-4" style={{ color: 'var(--cafe-brown-dark)' }}>
        <i className="bi bi-speedometer2 me-2"></i>Dashboard Overview
      </h4>

      {/* Stat Cards */}
      <div className="row g-3 mb-5">
        {statCards.map((card) => (
          <div key={card.label} className="col-6 col-lg-4">
            <div className="stat-card" style={{ background: card.bg }}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-value" style={{ color: card.color }}>{card.value}</div>
              <div className="stat-label text-muted">{card.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Recent Orders */}
      <div className="card-cafe p-4">
        <h6 className="fw-bold mb-3">
          <i className="bi bi-clock me-2"></i>Recent Orders
          <span className="badge bg-secondary ms-2" style={{ fontSize: '0.75rem' }}>Live</span>
        </h6>

        <div className="table-responsive">
          <table className="table table-hover table-cafe mb-0">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 ? (
                <tr><td colSpan={6} className="text-center text-muted py-4">No orders yet</td></tr>
              ) : recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>
                    <span className="font-monospace text-muted" style={{ fontSize: '0.8rem' }}>
                      #{order._id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="fw-semibold" style={{ fontSize: '0.85rem' }}>{order.user?.name}</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>{order.user?.email}</div>
                  </td>
                  <td>
                    <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                      {order.items.length} item(s)
                    </span>
                  </td>
                  <td className="fw-bold" style={{ color: 'var(--cafe-brown)' }}>
                    ₹{order.totalAmount}
                  </td>
                  <td>
                    <span className={`status-badge status-${order.status}`}>{order.status}</span>
                  </td>
                  <td>
                    {STATUS_NEXT[order.status] && (
                      <button
                        className="btn btn-sm btn-cafe"
                        onClick={() => updateStatus(order._id, STATUS_NEXT[order.status])}
                        style={{ fontSize: '0.75rem' }}
                      >
                        → {STATUS_NEXT[order.status]}
                      </button>
                    )}
                    {order.status === 'Completed' && (
                      <span className="text-success small">✓ Done</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
