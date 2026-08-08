import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminOverview from '../components/admin/AdminOverview';
import OrdersTable from '../components/admin/OrdersTable';
import PaymentHistory from '../components/admin/PaymentHistory';
import LoginLogs from '../components/admin/LoginLogs';
import CustomersList from '../components/admin/CustomersList';
import MenuManager from '../components/admin/MenuManager';

/**
 * AdminDashboard — layout wrapper for all admin pages
 * Uses a persistent sidebar + main content area
 */
export default function AdminDashboard() {
  return (
    <div>
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <main className="admin-content">
        <Routes>
          <Route index element={<AdminOverview />} />
          <Route path="orders" element={<OrdersTable />} />
          <Route path="payments" element={<PaymentHistory />} />
          <Route path="users" element={<CustomersList />} />
          <Route path="login-logs" element={<LoginLogs />} />
          <Route path="menu" element={<MenuManager />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </main>
    </div>
  );
}
