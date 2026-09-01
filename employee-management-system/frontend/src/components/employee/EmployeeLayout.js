import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import EmployeeSidebar from './EmployeeSidebar';
import EmployeeHeader from './EmployeeHeader';

const EmployeeLayout = () => {
  const { user } = useAuth();
  const { sidebarCollapsed } = useApp();

  if (!user) return <Navigate to="/login" replace />;

  // Admins/HR/Managers go back to admin dashboard if they land on employee routes
  if (user.role !== 'Employee') return <Navigate to="/dashboard" replace />;

  return (
    <div className="app-layout">
      <EmployeeSidebar />
      <div className={`main-content ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <EmployeeHeader />
        <main className="page-container">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default EmployeeLayout;
